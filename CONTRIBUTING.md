# Contributing to Smart CSV Data Analyst Agent

First off, thank you for taking the time to contribute! We welcome contributions to enhance SaaS capability, local LLM integrations, and code optimizations.

## Code of Conduct
This project adheres to standard open-source developer behavioral covenants. Please be respectful and professional in all communications.

## Development Workflow
1. **Fork** this repository.
2. **Clone** your fork and configure remote upstream targets:
   ```bash
   git clone https://github.com/your-username/smart-csv-data-analyst-agent.git
   ```
3. Create a descriptive feature branch:
   ```bash
   git checkout -b feature/awesome-new-capability
   ```
4. Perform your modifications:
   - Ensure backend changes compile and pass `pytest`.
   - Ensure frontend compiles successfully using `npm run build` with zero TypeScript compiler warnings.
5. Commit and push your changes:
   ```bash
   git commit -m "feat: implement awesome new capability"
   git push origin feature/awesome-new-capability
   ```
6. Open a **Pull Request** detailing your architectural additions.

## Code Style Guides
- **Backend Python**: Follow PEP-8 styling standards. Format scripts using `black`.
- **Frontend TS/React**: Use functional React components with hooks. Clean up unused imports, parameters, and variable references before submitting PRs.
