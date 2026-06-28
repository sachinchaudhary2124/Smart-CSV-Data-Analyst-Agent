import React, { useState, useEffect } from "react";
import {
  UploadCloud,
  FileSpreadsheet,
  AlertCircle,
  Trash2,
  Loader2,
  Database,
  CheckCircle,
  XCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Sliders,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface UploadedFile {
  upload_id: string;
  original_name: string;
  saved_name: string;
  upload_time: string;
  file_size: number;
  columns: string[];
  rows: number;
  status: string;
}

export const UploadPage: React.FC = () => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Selected dataset states
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<any | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "explorer">("profile");

  // Explorer states
  const [explorerData, setExplorerData] = useState<any | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortDesc, setSortDesc] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
  const [loadingExplorer, setLoadingExplorer] = useState(false);

  // Fetch uploads
  const fetchRecent = async () => {
    try {
      const res = await fetch(
        "http://https://smart-csv-data-analyst-api.onrender.com/api/upload/recent",
      );
      if (res.ok) {
        const data = await res.json();
        setUploadedFiles(data);
        if (data.length > 0 && !selectedId) {
          handleSelectFile(data[0].upload_id);
        }
      }
    } catch (err) {
      console.warn("Could not query uploads from backend", err);
    }
  };

  useEffect(() => {
    fetchRecent();
  }, []);

  const handleSelectFile = async (id: string) => {
    setSelectedId(id);
    setLoadingAnalysis(true);
    setSelectedColumn(null);
    setSearch("");
    setSortBy(null);
    setPage(1);

    try {
      // Set active dataset globally on backend
      await fetch(
        `http://https://smart-csv-data-analyst-api.onrender.com/api/upload/active/${id}`,
        { method: "POST" },
      );

      // Fetch dynamic profiling details
      const profileRes = await fetch(
        `http://https://smart-csv-data-analyst-api.onrender.com/api/upload/${id}/profile`,
      );
      if (profileRes.ok) {
        const pData = await profileRes.json();
        setProfileData(pData);
      }
    } catch (err) {
      console.error("Failed loading dataset properties", err);
      setErrorMessage("Failed to load dataset details.");
    } finally {
      setLoadingAnalysis(false);
    }
  };

  // Fetch Explorer rows
  const fetchExplorerRows = async () => {
    if (!selectedId) return;
    setLoadingExplorer(true);
    try {
      let url = `http://https://smart-csv-data-analyst-api.onrender.com/api/upload/${selectedId}/explorer?page=${page}&size=${pageSize}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (sortBy) {
        url += `&sort_by=${encodeURIComponent(sortBy)}&sort_desc=${sortDesc}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setExplorerData(data);
        // Default select first column profile if none selected
        if (data.columns && data.columns.length > 0 && !selectedColumn) {
          setSelectedColumn(data.columns[0]);
        }
      }
    } catch (err) {
      console.error("Failed fetching explorer rows:", err);
    } finally {
      setLoadingExplorer(false);
    }
  };

  useEffect(() => {
    if (selectedId && activeTab === "explorer") {
      fetchExplorerRows();
    }
  }, [selectedId, activeTab, page, search, sortBy, sortDesc]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = async (file: File) => {
    if (!file.name.endsWith(".csv")) {
      setErrorMessage("Unsupported file type. Only CSV files are parsed.");
      return;
    }

    setUploading(true);
    setErrorMessage(null);
    setUploadProgress(10);

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploadProgress(40);
      const res = await fetch(
        "http://https://smart-csv-data-analyst-api.onrender.com/api/upload/upload",
        {
          method: "POST",
          body: formData,
        },
      );

      setUploadProgress(80);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Upload execution failed.");
      }

      const metadata = await res.json();
      setUploadProgress(100);

      // Reload inventories list
      await fetchRecent();
      handleSelectFile(metadata.upload_id);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to process CSV file.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this dataset?")) return;
    try {
      const res = await fetch(
        `http://https://smart-csv-data-analyst-api.onrender.com/api/upload/${id}`,
        { method: "DELETE" },
      );
      if (res.ok) {
        if (selectedId === id) {
          setSelectedId(null);
          setProfileData(null);
          setExplorerData(null);
        }
        fetchRecent();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const handleSort = (colName: string) => {
    if (sortBy === colName) {
      setSortDesc(!sortDesc);
    } else {
      setSortBy(colName);
      setSortDesc(false);
    }
    setPage(1);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans animate-fadeIn">
      {/* Page Title */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <Database className="text-indigo-400" size={20} />
          <span>Dataset Control Hub</span>
        </h1>
        <p className="text-xs text-zinc-500">
          Upload dataset spreadsheets, check capabilities matrix, and inspect
          data values.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: upload and file registry list */}
        <div className="space-y-6">
          {/* Drag & drop upload area */}
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`
              glass-panel p-8 rounded-2xl border text-center transition-all duration-200 relative overflow-hidden
              ${dragActive ? "border-indigo-500 bg-indigo-500/5" : "border-zinc-900 bg-zinc-950/20 hover:border-zinc-800"}
            `}
          >
            <input
              type="file"
              id="file-upload-input"
              className="hidden"
              accept=".csv"
              onChange={handleFileChange}
            />

            <AnimatePresence mode="wait">
              {uploading ? (
                <motion.div
                  key="uploading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-zinc-200">
                      Parsing spreadsheet structures...
                    </span>
                    <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden">
                      <motion.div
                        className="bg-indigo-500 h-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                        transition={{ duration: 0.2 }}
                      />
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="upload-idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-3"
                >
                  <UploadCloud size={24} className="text-indigo-400 mx-auto" />
                  <div className="space-y-0.5">
                    <h3 className="text-xs font-bold text-zinc-200">
                      Drag & drop CSV files or{" "}
                      <label
                        htmlFor="file-upload-input"
                        className="text-indigo-400 hover:text-indigo-300 cursor-pointer underline font-medium"
                      >
                        browse local files
                      </label>
                    </h3>
                    <p className="text-[10px] text-zinc-500">
                      Only standard CSV format spreadsheets up to 50MB
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Feedback errors */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-2.5 text-xs text-rose-400">
              <AlertCircle size={14} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Dataset Inventories */}
          <div className="glass-panel rounded-2xl p-5 space-y-4 border-zinc-900 bg-zinc-950/15">
            <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <Database size={14} className="text-zinc-600" />
              <span>Dataset Inventories</span>
            </h2>

            <div className="space-y-2 max-h-[280px] overflow-y-auto custom-scrollbar">
              {uploadedFiles.length === 0 ? (
                <div className="text-center py-6 text-zinc-600 text-xs">
                  No datasets uploaded yet.
                </div>
              ) : (
                uploadedFiles.map((file) => (
                  <div
                    key={file.upload_id}
                    onClick={() => handleSelectFile(file.upload_id)}
                    className={`
                      flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all duration-200
                      ${
                        selectedId === file.upload_id
                          ? "bg-indigo-500/10 border-indigo-500/30"
                          : "bg-zinc-900/40 border-zinc-900/80 hover:border-zinc-800"
                      }
                    `}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          selectedId === file.upload_id
                            ? "bg-indigo-500/20 text-indigo-400"
                            : "bg-zinc-900 text-zinc-500"
                        }`}
                      >
                        <FileSpreadsheet size={15} />
                      </div>
                      <div className="truncate text-left">
                        <h4
                          className="text-xs font-semibold text-zinc-200 truncate max-w-[130px]"
                          title={file.original_name}
                        >
                          {file.original_name}
                        </h4>
                        <span className="text-[9px] text-zinc-500">
                          {formatSize(file.file_size)}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => handleDelete(file.upload_id, e)}
                      className="text-zinc-600 hover:text-rose-400 p-1.5 rounded-lg hover:bg-zinc-800 transition"
                      title="Delete dataset"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Tabbed Profile Dashboard & Explorer */}
        <div className="lg:col-span-2 space-y-6">
          {loadingAnalysis ? (
            <div className="glass-panel p-16 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 min-h-[450px]">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              <div className="space-y-1">
                <h3 className="text-xs font-semibold text-zinc-200">
                  Executing Dataset Profiling...
                </h3>
                <p className="text-[10px] text-zinc-500 font-mono">
                  Running automatic type and capability diagnostics checks
                </p>
              </div>
            </div>
          ) : selectedId && profileData ? (
            <div className="space-y-6">
              {/* Tab Navigation header */}
              <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                <div className="flex items-center gap-2 bg-zinc-900/40 p-0.5 rounded-lg border border-zinc-900">
                  <button
                    onClick={() => setActiveTab("profile")}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                      activeTab === "profile"
                        ? "bg-zinc-800 text-white shadow-sm"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    Dataset Intelligence
                  </button>
                  <button
                    onClick={() => setActiveTab("explorer")}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                      activeTab === "explorer"
                        ? "bg-zinc-800 text-white shadow-sm"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    Interactive Explorer
                  </button>
                </div>

                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                  {profileData.dataset_complexity} Complexity
                </span>
              </div>

              {/* Tab 1: Dataset Intelligence Profile */}
              {activeTab === "profile" && (
                <div className="space-y-6 animate-fadeIn">
                  {/* Summary card description */}
                  <div className="glass-panel p-5 rounded-2xl border-zinc-900 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                        Profiling Summary
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
                          profileData.dataset_quality_grade === "Excellent"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : profileData.dataset_quality_grade === "Good"
                              ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        }`}
                      >
                        Quality: {profileData.dataset_quality_grade} (
                        {profileData.health_score}%)
                      </span>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                      {profileData.human_readable_summary}
                    </p>
                  </div>

                  {/* Core dimensions counts */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="glass-panel p-4 rounded-xl border-zinc-900 text-center space-y-0.5">
                      <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">
                        Total Rows
                      </span>
                      <span className="text-base font-bold text-white font-mono">
                        {profileData.rows.toLocaleString()}
                      </span>
                    </div>
                    <div className="glass-panel p-4 rounded-xl border-zinc-900 text-center space-y-0.5">
                      <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">
                        Total Columns
                      </span>
                      <span className="text-base font-bold text-white font-mono">
                        {profileData.columns}
                      </span>
                    </div>
                    <div className="glass-panel p-4 rounded-xl border-zinc-900 text-center space-y-0.5">
                      <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">
                        Missing Cells
                      </span>
                      <span className="text-base font-bold text-white font-mono">
                        {profileData.missing_values.toLocaleString()}
                      </span>
                    </div>
                    <div className="glass-panel p-4 rounded-xl border-zinc-900 text-center space-y-0.5">
                      <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">
                        Duplicate Rows
                      </span>
                      <span className="text-base font-bold text-white font-mono">
                        {profileData.duplicate_rows}
                      </span>
                    </div>
                  </div>

                  {/* Column statistics type layout classifications */}
                  <div className="glass-panel p-5 rounded-2xl border-zinc-900 space-y-4">
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                      Columns Role Classifications
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
                      <div className="p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-900/80 space-y-1">
                        <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">
                          Numeric Fields
                        </span>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {profileData.numeric_columns.length === 0 ? (
                            <span className="text-zinc-600 text-[10px]">
                              None
                            </span>
                          ) : (
                            profileData.numeric_columns.map((c: string) => (
                              <span
                                key={c}
                                className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[9px] font-mono"
                              >
                                {c}
                              </span>
                            ))
                          )}
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-900/80 space-y-1">
                        <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">
                          Datetime Fields
                        </span>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {profileData.datetime_columns.length === 0 ? (
                            <span className="text-zinc-600 text-[10px]">
                              None
                            </span>
                          ) : (
                            profileData.datetime_columns.map((c: string) => (
                              <span
                                key={c}
                                className="px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[9px] font-mono"
                              >
                                {c}
                              </span>
                            ))
                          )}
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-900/80 space-y-1">
                        <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">
                          Categorical Fields
                        </span>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {profileData.categorical_columns.length === 0 ? (
                            <span className="text-zinc-600 text-[10px]">
                              None
                            </span>
                          ) : (
                            profileData.categorical_columns.map((c: string) => (
                              <span
                                key={c}
                                className="px-1.5 py-0.5 rounded bg-pink-500/10 text-pink-400 border border-pink-500/20 text-[9px] font-mono"
                              >
                                {c}
                              </span>
                            ))
                          )}
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-900/80 space-y-1">
                        <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">
                          Target Labels
                        </span>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {profileData.possible_target_columns.length === 0 ? (
                            <span className="text-zinc-600 text-[10px]">
                              None
                            </span>
                          ) : (
                            profileData.possible_target_columns.map(
                              (c: string) => (
                                <span
                                  key={c}
                                  className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-mono"
                                >
                                  {c}
                                </span>
                              ),
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Capability detector availability checklist */}
                  <div className="glass-panel p-5 rounded-2xl border-zinc-900 space-y-4">
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                      <TrendingUp size={13} className="text-indigo-400" />
                      <span>Capability Availability Checklist</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {profileData.capabilities.map((cap: any) => (
                        <div
                          key={cap.name}
                          className="flex items-start gap-2.5 p-2.5 rounded-lg bg-zinc-900/20 border border-zinc-900/80 hover:border-zinc-900 transition"
                        >
                          <div className="shrink-0 mt-0.5">
                            {cap.available ? (
                              <CheckCircle
                                size={14}
                                className="text-emerald-500"
                              />
                            ) : (
                              <XCircle size={14} className="text-zinc-700" />
                            )}
                          </div>
                          <div className="space-y-0.5">
                            <span
                              className={`font-semibold ${cap.available ? "text-zinc-200" : "text-zinc-500 line-through"}`}
                            >
                              {cap.name}
                            </span>
                            <p className="text-[10px] text-zinc-500 font-sans leading-relaxed">
                              {cap.reason}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Interactive Explorer spreadsheet */}
              {activeTab === "explorer" && (
                <div className="space-y-6 animate-fadeIn">
                  {/* Controls header */}
                  <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
                    <div className="relative w-full sm:w-64">
                      <Search
                        className="absolute left-3 top-2.5 text-zinc-600"
                        size={13}
                      />
                      <input
                        type="text"
                        placeholder="Search data records..."
                        value={search}
                        onChange={(e) => {
                          setSearch(e.target.value);
                          setPage(1);
                        }}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="text-[10px] text-zinc-500 font-mono">
                      Click column headers to sort rows or review detailed
                      statistical stats profiles.
                    </div>
                  </div>

                  {/* Main Grid: Data rows & Stats sidebar */}
                  <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
                    {/* Data Rows table */}
                    <div className="xl:col-span-3 glass-panel rounded-2xl overflow-hidden border border-zinc-900 relative">
                      {loadingExplorer && (
                        <div className="absolute inset-0 bg-background/50 z-20 flex items-center justify-center">
                          <Loader2
                            className="animate-spin text-indigo-500"
                            size={24}
                          />
                        </div>
                      )}

                      <div className="overflow-x-auto custom-scrollbar max-h-[500px]">
                        <table className="w-full border-collapse text-[11px] font-mono text-left">
                          <thead>
                            <tr className="border-b border-zinc-900 bg-zinc-900/30 text-zinc-400 select-none">
                              {explorerData?.columns.map((col: string) => (
                                <th
                                  key={col}
                                  onClick={() => handleSort(col)}
                                  className={`p-3 border-r border-zinc-900/60 font-semibold font-sans cursor-pointer hover:bg-zinc-800/40 transition ${
                                    sortBy === col
                                      ? "text-indigo-400 bg-indigo-500/5"
                                      : ""
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <span>{col}</span>
                                    {sortBy === col && (
                                      <span className="text-[9px]">
                                        {sortDesc ? "▼" : "▲"}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[8px] text-zinc-600 font-mono font-normal normal-case pt-0.5">
                                    {explorerData.columns_profile[col]?.dtype}
                                  </div>
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {explorerData?.records &&
                            explorerData.records.length > 0 ? (
                              explorerData.records.map(
                                (row: any, rIdx: number) => (
                                  <tr
                                    key={rIdx}
                                    className="border-b border-zinc-900/30 hover:bg-zinc-900/10 text-zinc-300"
                                  >
                                    {explorerData.columns.map((col: string) => (
                                      <td
                                        key={col}
                                        className="p-2.5 border-r border-zinc-900/30 truncate max-w-[120px]"
                                      >
                                        {row[col] === null ? (
                                          <span className="text-zinc-700 italic">
                                            NULL
                                          </span>
                                        ) : (
                                          String(row[col])
                                        )}
                                      </td>
                                    ))}
                                  </tr>
                                ),
                              )
                            ) : (
                              <tr>
                                <td
                                  colSpan={explorerData?.columns.length || 1}
                                  className="p-8 text-center text-zinc-500 text-xs font-sans"
                                >
                                  No records found matching query filters.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination Controls */}
                      {explorerData && explorerData.total_rows > 0 && (
                        <div className="px-4 py-3 border-t border-zinc-900 bg-zinc-950/40 flex items-center justify-between text-xs font-sans text-zinc-500 select-none">
                          <div>
                            Showing{" "}
                            <span className="text-zinc-300 font-bold">
                              {(page - 1) * pageSize + 1}
                            </span>{" "}
                            -{" "}
                            <span className="text-zinc-300 font-bold">
                              {Math.min(
                                page * pageSize,
                                explorerData.total_rows,
                              )}
                            </span>{" "}
                            of{" "}
                            <span className="text-zinc-300 font-bold">
                              {explorerData.total_rows.toLocaleString()}
                            </span>{" "}
                            entries
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              disabled={page === 1}
                              onClick={() =>
                                setPage((prev) => Math.max(1, prev - 1))
                              }
                              className="p-1.5 rounded bg-zinc-900 border border-zinc-800 disabled:opacity-40 hover:text-white transition"
                            >
                              <ChevronLeft size={13} />
                            </button>
                            <span className="text-[10px] font-mono px-1">
                              Page {page}
                            </span>
                            <button
                              disabled={
                                page * pageSize >= explorerData.total_rows
                              }
                              onClick={() => setPage((prev) => prev + 1)}
                              className="p-1.5 rounded bg-zinc-900 border border-zinc-800 disabled:opacity-40 hover:text-white transition"
                            >
                              <ChevronRight size={13} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Stats Sidebar */}
                    <div className="xl:col-span-1 space-y-4">
                      <div className="glass-panel p-4 rounded-xl border-zinc-900 space-y-4 font-sans text-xs">
                        {/* Selector info */}
                        <div className="space-y-1">
                          <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1">
                            <Sliders size={11} className="text-indigo-400" />
                            <span>Select column stats profile</span>
                          </span>
                          <select
                            value={selectedColumn || ""}
                            onChange={(e) => setSelectedColumn(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 rounded px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none cursor-pointer"
                          >
                            {explorerData?.columns.map((c: string) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        </div>

                        {selectedColumn &&
                          explorerData?.columns_profile[selectedColumn] && (
                            <div className="space-y-3 pt-1">
                              <div className="border-b border-zinc-900 pb-2 flex justify-between items-center">
                                <span className="font-bold text-zinc-300 truncate max-w-[120px]">
                                  {selectedColumn}
                                </span>
                                <span className="text-[9px] font-mono text-indigo-400 uppercase">
                                  {
                                    explorerData.columns_profile[selectedColumn]
                                      .dtype
                                  }
                                </span>
                              </div>

                              <div className="space-y-2 font-mono">
                                <div className="flex justify-between py-1 border-b border-zinc-900/60">
                                  <span className="text-zinc-500 font-sans">
                                    Unique Count
                                  </span>
                                  <span className="text-zinc-200">
                                    {
                                      explorerData.columns_profile[
                                        selectedColumn
                                      ].unique_count
                                    }
                                  </span>
                                </div>

                                <div className="flex justify-between py-1 border-b border-zinc-900/60">
                                  <span className="text-zinc-500 font-sans">
                                    Missing %
                                  </span>
                                  <span className="text-zinc-200">
                                    {
                                      explorerData.columns_profile[
                                        selectedColumn
                                      ].missing_pct
                                    }
                                    %
                                  </span>
                                </div>

                                {/* Numeric parameters */}
                                {explorerData.columns_profile[selectedColumn]
                                  .min !== null && (
                                  <>
                                    <div className="flex justify-between py-1 border-b border-zinc-900/60">
                                      <span className="text-zinc-500 font-sans">
                                        Minimum
                                      </span>
                                      <span className="text-zinc-200">
                                        {explorerData.columns_profile[
                                          selectedColumn
                                        ].min.toLocaleString()}
                                      </span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-zinc-900/60">
                                      <span className="text-zinc-500 font-sans">
                                        Maximum
                                      </span>
                                      <span className="text-zinc-200">
                                        {explorerData.columns_profile[
                                          selectedColumn
                                        ].max.toLocaleString()}
                                      </span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-zinc-900/60">
                                      <span className="text-zinc-500 font-sans">
                                        Average
                                      </span>
                                      <span className="text-zinc-200">
                                        {explorerData.columns_profile[
                                          selectedColumn
                                        ].mean !== null
                                          ? explorerData.columns_profile[
                                              selectedColumn
                                            ].mean.toFixed(2)
                                          : "N/A"}
                                      </span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-zinc-900/60">
                                      <span className="text-zinc-500 font-sans">
                                        Median
                                      </span>
                                      <span className="text-zinc-200">
                                        {explorerData.columns_profile[
                                          selectedColumn
                                        ].median !== null
                                          ? explorerData.columns_profile[
                                              selectedColumn
                                            ].median.toFixed(2)
                                          : "N/A"}
                                      </span>
                                    </div>
                                  </>
                                )}
                              </div>

                              {/* Example values list */}
                              <div className="space-y-1.5 pt-1">
                                <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">
                                  Example Values
                                </span>
                                <div className="space-y-1 max-h-36 overflow-y-auto custom-scrollbar font-mono text-[10px]">
                                  {explorerData.columns_profile[
                                    selectedColumn
                                  ].example_values.map(
                                    (ex: string, i: number) => (
                                      <div
                                        key={i}
                                        className="p-1 rounded bg-zinc-900/60 border border-zinc-900 text-zinc-400 truncate"
                                      >
                                        {ex}
                                      </div>
                                    ),
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="glass-panel p-16 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 min-h-[450px]">
              <FileSpreadsheet size={32} className="text-zinc-700" />
              <div>
                <h3 className="text-xs font-semibold text-zinc-400">
                  No Dataset Selected
                </h3>
                <p className="text-[10px] text-zinc-500 mt-1 max-w-sm">
                  Upload a CSV file or select a file from the inventory list to
                  perform diagnostics evaluations and read rows.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default UploadPage;
