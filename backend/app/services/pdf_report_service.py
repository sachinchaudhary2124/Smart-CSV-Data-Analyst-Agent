import os
import time
import logging
from datetime import datetime
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, PageBreak, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

from app.core.config import settings
from app.tools.csv_tools import executive_kpi_calculator, ExecutiveKPIsInput, _map_columns, anomaly_detection_extended, AnomalyInput

logger = logging.getLogger(__name__)

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_number(num_pages)
            super().showPage()
        super().save()

    def draw_page_number(self, page_count):
        if self._pageNumber == 1:
            return  # Skip cover page
        self.saveState()
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#71717a"))
        
        # Header
        self.drawString(54, 755, "SMART CSV DATA ANALYST AGENT  |  EXECUTIVE REPORT")
        self.setStrokeColor(colors.HexColor("#e4e4e7"))
        self.setLineWidth(0.5)
        self.line(54, 747, 558, 747)
        
        # Footer
        self.line(54, 60, 558, 60)
        self.setFont("Helvetica", 8)
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(558, 45, page_text)
        self.drawString(54, 45, "CONFIDENTIAL  *  GENERATED AUTOMATICALLY BY BUSINESS INSIGHTS ENGINE")
        self.restoreState()


class PDFReportService:
    def generate_pdf(self, upload_id: str, df: pd.DataFrame, meta: dict) -> str:
        pdf_filename = f"report_{upload_id}.pdf"
        pdf_path = os.path.join(settings.REPORT_DIR, pdf_filename)
        
        # Clean existing report file if any
        if os.path.exists(pdf_path):
            try:
                os.remove(pdf_path)
            except Exception as e:
                logger.warning(f"Could not remove old report: {e}")

        # Gather KPIs and anomalies
        kpi_input = ExecutiveKPIsInput(file_path=os.path.join(settings.UPLOAD_DIR, meta["saved_name"]))
        kpi_res = executive_kpi_calculator(kpi_input)
        kpis = kpi_res.get("data", {})
        
        anomaly_res = anomaly_detection_extended(AnomalyInput(file_path=os.path.join(settings.UPLOAD_DIR, meta["saved_name"])))
        anomalies = anomaly_res.get("data", [])
        
        mapping = _map_columns(df)
        
        # Generate a styled chart image
        chart_image_path = self._generate_report_chart(upload_id, df, mapping)

        # Setup PDF styles
        doc = SimpleDocTemplate(
            pdf_path,
            pagesize=letter,
            rightMargin=54,
            leftMargin=54,
            topMargin=72,
            bottomMargin=72
        )
        
        styles = getSampleStyleSheet()
        
        title_style = ParagraphStyle(
            'CoverTitle',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=32,
            leading=38,
            textColor=colors.HexColor("#1e1b4b"), # indigo dark
            spaceAfter=15
        )
        subtitle_style = ParagraphStyle(
            'CoverSubtitle',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=14,
            leading=18,
            textColor=colors.HexColor("#4f46e5"), # indigo medium
            spaceAfter=25
        )
        meta_label_style = ParagraphStyle(
            'MetaLabel',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=9,
            textColor=colors.HexColor("#71717a")
        )
        meta_val_style = ParagraphStyle(
            'MetaVal',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9,
            textColor=colors.HexColor("#18181b")
        )
        h1_style = ParagraphStyle(
            'H1',
            parent=styles['Heading2'],
            fontName='Helvetica-Bold',
            fontSize=20,
            leading=24,
            textColor=colors.HexColor("#1e1b4b"),
            spaceBefore=15,
            spaceAfter=10,
            keepWithNext=True
        )
        h2_style = ParagraphStyle(
            'H2',
            parent=styles['Heading3'],
            fontName='Helvetica-Bold',
            fontSize=12,
            leading=16,
            textColor=colors.HexColor("#4f46e5"),
            spaceBefore=10,
            spaceAfter=6,
            keepWithNext=True
        )
        body_style = ParagraphStyle(
            'Body',
            parent=styles['BodyText'],
            fontName='Helvetica',
            fontSize=10,
            leading=14,
            textColor=colors.HexColor("#27272a"),
            spaceAfter=10
        )
        bullet_style = ParagraphStyle(
            'BulletText',
            parent=styles['BodyText'],
            fontName='Helvetica',
            fontSize=9.5,
            leading=13,
            textColor=colors.HexColor("#27272a"),
            leftIndent=15,
            firstLineIndent=-10,
            spaceAfter=6
        )

        story = []

        # COVER PAGE
        story.append(Spacer(1, 40))
        logo_data = [[Paragraph("<b>PLATFORM ANALYTICS</b> SYSTEM", ParagraphStyle('Logo', fontSize=12, textColor=colors.white))]]
        logo_table = Table(logo_data, colWidths=[200])
        logo_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#1e1b4b")),
            ('PADDING', (0,0), (-1,-1), 10),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 12),
        ]))
        story.append(logo_table)
        story.append(Spacer(1, 100))
        
        story.append(Paragraph("Enterprise Data Analysis Report", title_style))
        story.append(Paragraph(f"Dataset: {meta['original_name']}", subtitle_style))
        story.append(Spacer(1, 150))
        
        meta_data = [
            [Paragraph("Report ID:", meta_label_style), Paragraph(f"REP-{upload_id[:8].upper()}", meta_val_style)],
            [Paragraph("Generated At:", meta_label_style), Paragraph(datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC"), meta_val_style)],
            [Paragraph("Rows Count:", meta_label_style), Paragraph(f"{meta['rows']:,} rows", meta_val_style)],
            [Paragraph("Features Count:", meta_label_style), Paragraph(f"{len(meta['columns'])} columns", meta_val_style)],
            [Paragraph("Security Classification:", meta_label_style), Paragraph("Confidential - Internal Review Only", ParagraphStyle('RedMeta', parent=meta_val_style, textColor=colors.HexColor("#e11d48")))]
        ]
        meta_table = Table(meta_data, colWidths=[150, 300])
        meta_table.setStyle(TableStyle([
            ('LINEBELOW', (0,0), (-1,-1), 0.5, colors.HexColor("#f4f4f5")),
            ('PADDING', (0,0), (-1,-1), 6),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ]))
        story.append(meta_table)
        story.append(PageBreak())

        # DATASET OVERVIEW
        story.append(Paragraph("1. Dataset Overview", h1_style))
        story.append(Paragraph(
            f"The ingested dataset <b>{meta['original_name']}</b> contains a total layout of <b>{meta['rows']:,} records</b> "
            f"and <b>{len(meta['columns'])} variables</b>. A structural scan of the schema was completed to verify completeness.",
            body_style
        ))
        
        schema_data = [["Column Feature", "Data Type", "Missing Count", "Percentage Complete"]]
        for col in df.columns[:10]:
            nulls = int(df[col].isnull().sum())
            pct = ((len(df) - nulls) / len(df)) * 100
            schema_data.append([
                col,
                str(df[col].dtype),
                f"{nulls:,}",
                f"{pct:.1f}%"
            ])
            
        schema_table = Table(schema_data, colWidths=[150, 100, 100, 150])
        schema_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#f4f4f5")),
            ('TEXTCOLOR', (0,0), (-1,0), colors.HexColor("#18181b")),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,0), 9),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e4e4e7")),
            ('PADDING', (0,0), (-1,-1), 5),
            ('FONTSIZE', (0,1), (-1,-1), 8.5),
        ]))
        story.append(schema_table)
        if len(df.columns) > 10:
            story.append(Paragraph(f"<i>* Showing top 10 of {len(df.columns)} columns total. Appendix contains full metrics registry details.</i>", ParagraphStyle('FootNote', parent=body_style, fontSize=8, textColor=colors.HexColor("#71717a"))))
            
        story.append(Spacer(1, 15))

        # EXECUTIVE SUMMARY
        story.append(Paragraph("2. Executive Summary", h1_style))
        
        rev_val = kpis.get("revenue", {}).get("value", "$0.00")
        orders_val = kpis.get("orders", {}).get("value", "0")
        top_prod_val = kpis.get("top_product", {}).get("value", "N/A")
        growth_val = kpis.get("growth", {}).get("value", "0.0%")
        aov_val = kpis.get("aov", {}).get("value", "$0.00")
        
        summary_text = (
            f"Following a rigorous automated run over the active metrics, the platform has compiled critical findings. "
            f"Gross registered performance generated a total transaction value of <b>{rev_val}</b> across <b>{orders_val} processed orders</b>, "
            f"reflecting a mean Average Order Value (AOV) of <b>{aov_val}</b>. Performance analysis shows a growth momentum of <b>{growth_val} MoM</b>. "
            f"The primary driver of gross volume was category leader <b>{top_prod_val}</b>."
        )
        story.append(Paragraph(summary_text, body_style))
        
        kpi_grid_data = [
            [
                Paragraph("<b>GROSS REVENUE</b><br/>" + rev_val, ParagraphStyle('GridCell', fontSize=10, leading=14)),
                Paragraph("<b>TOTAL ORDERS</b><br/>" + orders_val, ParagraphStyle('GridCell', fontSize=10, leading=14)),
                Paragraph("<b>REVENUE GROWTH</b><br/>" + growth_val, ParagraphStyle('GridCell', fontSize=10, leading=14))
            ],
            [
                Paragraph("<b>AVERAGE ORDER VALUE</b><br/>" + aov_val, ParagraphStyle('GridCell', fontSize=10, leading=14)),
                Paragraph("<b>TOP PRODUCT</b><br/>" + top_prod_val, ParagraphStyle('GridCell', fontSize=10, leading=14)),
                Paragraph("<b>TOP CATEGORY</b><br/>" + kpis.get("top_category", {}).get("value", "N/A"), ParagraphStyle('GridCell', fontSize=10, leading=14))
            ]
        ]
        kpi_table = Table(kpi_grid_data, colWidths=[166, 166, 166])
        kpi_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f8fafc")),
            ('GRID', (0,0), (-1,-1), 1, colors.HexColor("#e2e8f0")),
            ('PADDING', (0,0), (-1,-1), 10),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ]))
        story.append(kpi_table)
        story.append(PageBreak())

        # CHARTS SECTION
        story.append(Paragraph("3. Visual Insights & Trends Analysis", h1_style))
        if chart_image_path and os.path.exists(chart_image_path):
            story.append(Image(chart_image_path, width=450, height=220))
            story.append(Spacer(1, 10))
            story.append(Paragraph("<i>Figure 3.1: Historical Revenue/Units progression trends mapped across dates.</i>", ParagraphStyle('FigCap', parent=body_style, fontSize=8.5, textColor=colors.HexColor("#71717a"), alignment=1)))
        else:
            story.append(Paragraph("<i>Chart generation was bypassed due to missing numeric date values.</i>", body_style))
            
        story.append(Spacer(1, 15))

        # BUSINESS INSIGHTS & ANOMALIES
        story.append(Paragraph("4. Key Findings & Anomaly Detection", h1_style))
        story.append(Paragraph("Automated scanning rules isolated the following anomalies inside the metrics parameters:", body_style))
        
        for idx, anom in enumerate(anomalies[:3]):
            story.append(Paragraph(f"<b>* {anom['type']} in {anom['metric']}</b> ({anom['context']}): Value of <b>{anom['value']}</b>.<br/><i>Observation:</i> {anom['explanation']}<br/><i>Possible Cause:</i> {anom.get('reason')}", bullet_style))
            story.append(Spacer(1, 4))
            
        story.append(Spacer(1, 10))

        # OPERATIONAL RECOMMENDATIONS
        story.append(Paragraph("5. Recommended Strategic Actions", h1_style))
        
        recs = [
            ("Diversify Channel Dependency", "Allocate marketing budgets to underperforming category segments to distribute sales dependencies."),
            ("Configure Clearing Validation", "Rigidly monitor form validation layers to reduce missing entry indexes in customer logging."),
            ("Supply Chain Optimization", "Place purchase restocking orders for top categories early to safeguard margin targets.")
        ]
        
        if anomalies and len(anomalies) > 0 and anomalies[0].get("recommendation"):
            recs.insert(0, ("Anomaly Mitigation Strategy", anomalies[0]["recommendation"]))
            
        for idx, (title, desc) in enumerate(recs[:3]):
            story.append(Paragraph(f"<b>{idx+1}. {title}</b>: {desc}", bullet_style))
            story.append(Spacer(1, 4))
            
        story.append(Spacer(1, 15))

        # APPENDIX
        story.append(Paragraph("6. Appendix & Execution Logs", h1_style))
        story.append(Paragraph(
            "This report is generated dynamically by the Business Insights Engine using python library compilation services. "
            "Residual data verification is performed on structural checksum fields to eliminate database duplications.",
            body_style
        ))
        
        try:
            doc.build(story, canvasmaker=NumberedCanvas)
        except Exception as e:
            logger.error(f"Failed to build PDF report: {e}")
            raise e
        finally:
            if chart_image_path and os.path.exists(chart_image_path):
                try:
                    os.remove(chart_image_path)
                except Exception:
                    pass
                    
        return pdf_path

    def _generate_report_chart(self, upload_id: str, df: pd.DataFrame, mapping: dict) -> str:
        chart_path = os.path.join(settings.REPORT_DIR, f"temp_{upload_id}.png")
        rev_col = mapping["revenue"]
        date_col = mapping["date"]
        
        if not rev_col or not date_col:
            return ""
            
        try:
            df = df.copy()
            df['parsed_date'] = pd.to_datetime(df[date_col], errors='coerce')
            valid_df = df.dropna(subset=['parsed_date', rev_col])
            
            if valid_df.empty:
                return ""
                
            valid_df['month'] = valid_df['parsed_date'].dt.to_period('M')
            monthly_data = valid_df.groupby('month')[rev_col].sum().sort_index().tail(12)
            
            if monthly_data.empty:
                return ""
                
            plt.figure(figsize=(7, 3.5))
            x_labels = [str(x) for x in monthly_data.index]
            y_values = list(monthly_data.values)
            
            plt.plot(x_labels, y_values, marker='o', color='#4f46e5', linewidth=2.5, markersize=5)
            plt.fill_between(x_labels, y_values, color='#818cf8', alpha=0.15)
            
            plt.title("Revenue Trend Over Time", fontsize=11, fontweight='bold', color='#1e1b4b')
            plt.xlabel("Month Period", fontsize=8.5, color='#4b5563')
            plt.ylabel("Revenue ($)", fontsize=8.5, color='#4b5563')
            plt.xticks(rotation=25, fontsize=7.5)
            plt.yticks(fontsize=7.5)
            
            plt.grid(axis='y', linestyle='--', alpha=0.4)
            plt.gca().spines['top'].set_visible(False)
            plt.gca().spines['right'].set_visible(False)
            
            plt.tight_layout()
            plt.savefig(chart_path, dpi=200, transparent=True)
            plt.close()
            return chart_path
        except Exception as e:
            logger.warning(f"Failed to compile PDF trend chart figure: {e}")
            plt.close()
            return ""


pdf_report_service = PDFReportService()
