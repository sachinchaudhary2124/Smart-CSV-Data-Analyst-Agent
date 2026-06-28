import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  ArrowRight, 
  Cpu, 
  Terminal, 
  ShieldCheck, 
  Zap, 
  Layers, 
  Workflow, 
  Activity
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 }
    }
  };

  const features = [
    {
      title: "Multi-Agent Workflows",
      desc: "Powered by LangGraph, structured analysis routes queries through ingestion, validation, code generation, and sanity checking layers.",
      icon: Workflow,
      color: "text-indigo-400"
    },
    {
      title: "Local LLM Execution",
      desc: "Completely private data calculations running Ollama Llama3 model on your local cluster. No cloud data leakage risks.",
      icon: Cpu,
      color: "text-emerald-400"
    },
    {
      title: "Interactive Sandbox Execution",
      desc: "LLMs execute Pandas code commands inside isolated execution environments, performing mathematical validation on data uploads.",
      icon: Terminal,
      color: "text-cyan-400"
    },
    {
      title: "High Performance Visualizations",
      desc: "Instantly translate natural language requests into complex matplotlib graphs, pie charts, scatter correlations and trends.",
      icon: Zap,
      color: "text-pink-400"
    },
    {
      title: "Structured Executive Reporting",
      desc: "Convert analytical query logs into professional summaries, insights, recommendations and download clean PDFs for presentations.",
      icon: Layers,
      color: "text-purple-400"
    },
    {
      title: "Enterprise Grade Control",
      desc: "Robust logging, CORS permissions configuration, error handling, file upload volume limitations, and clean modular APIs.",
      icon: ShieldCheck,
      color: "text-amber-400"
    }
  ];

  const techStack = [
    { category: "Frontend", items: ["React", "TypeScript", "Vite", "Tailwind CSS", "Framer Motion", "Shadcn UI"] },
    { category: "Backend Framework", items: ["Python", "FastAPI", "Uvicorn", "Python-dotenv", "Logging Handlers"] },
    { category: "AI & Graph Pipeline", items: ["LangGraph", "LangChain Core", "Local Ollama Engine", "Llama3 LLM Model"] },
    { category: "Data Ingestion & Render", items: ["Pandas", "Matplotlib Charts", "NumPy Libraries", "PDF Toolkit"] }
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col justify-between selection:bg-indigo-500/20">
      
      {/* Decorative Grid Overlay and Light Effects */}
      <div className="absolute inset-0 bg-grid-pattern bg-grid-size opacity-40 pointer-events-none" />
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Navbar */}
      <header className="h-20 flex items-center justify-between px-8 md:px-16 border-b border-zinc-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-premium shadow-indigo-500/30">
            <Sparkles size={20} />
          </div>
          <span className="font-display font-bold text-lg text-white tracking-tight">Smart CSV Analyst</span>
        </div>
        <Link 
          to="/dashboard"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm font-semibold text-zinc-200 hover:text-white hover:bg-zinc-800 transition"
        >
          <span>Console</span>
          <ArrowRight size={14} />
        </Link>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-16 md:py-24 space-y-24 z-10">
        
        {/* Intro */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center max-w-4xl mx-auto space-y-6"
        >
          <motion.div 
            variants={itemVariants}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-300"
          >
            <Sparkles size={12} className="animate-spin-slow" />
            <span>AI-Driven Structured Intelligence Framework</span>
          </motion.div>
          
          <motion.h1 
            variants={itemVariants}
            className="font-display text-4xl sm:text-6xl font-bold tracking-tight text-white leading-tight"
          >
            Your Private, Enterprise-Grade <br/>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400">
              CSV Data Analyst Agent
            </span>
          </motion.h1>
          
          <motion.p 
            variants={itemVariants}
            className="text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed"
          >
            Upload datasets and perform zero-leakage, local analyses. Powered by multi-agent LangGraph logic, sandboxed Python code execution, and intuitive charts.
          </motion.p>
          
          <motion.div variants={itemVariants} className="pt-4">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-indigo-600 text-sm font-bold text-white hover:bg-indigo-700 active:scale-[0.98] shadow-premium shadow-indigo-600/30 transition-all"
            >
              <span>Get Started & Launch Workspace</span>
              <ArrowRight size={16} />
            </Link>
          </motion.div>
        </motion.div>

        {/* Feature Cards Grid */}
        <div className="space-y-12">
          <div className="text-center space-y-2">
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-white tracking-tight">Built for Production Quality</h2>
            <p className="text-sm text-zinc-500">Engineered with modular architectures, rigid type compliance, and dynamic dark aesthetics.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="glass-panel p-6 rounded-xl space-y-4 hover:border-indigo-500/30 transition-all duration-300"
              >
                <div className={`w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-premium ${feature.color}`}>
                  <feature.icon size={20} />
                </div>
                <h3 className="font-display font-semibold text-[17px] text-zinc-100">{feature.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Technology Stack Grid */}
        <div className="space-y-8 pb-8">
          <div className="text-center space-y-1">
            <h2 className="font-display text-2xl font-semibold text-white">Full-Stack Tech Infrastructure</h2>
            <p className="text-sm text-zinc-500">Modern developer tooling powering core interface visualizers and analytical compute servers.</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {techStack.map((tech, idx) => (
              <div 
                key={idx} 
                className="bg-zinc-900/40 border border-zinc-900 p-6 rounded-xl hover:border-zinc-800 transition"
              >
                <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-4 font-mono">{tech.category}</h4>
                <ul className="space-y-2">
                  {tech.items.map((item, key) => (
                    <li key={key} className="flex items-center gap-2 text-sm text-zinc-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950/40 py-8 px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 z-10">
        <span>© 2026 Smart CSV Data Analyst Agent. Open-source enterprise solution.</span>
        <div className="flex items-center gap-6 mt-4 sm:mt-0 font-mono">
          <span className="flex items-center gap-1.5"><Activity size={12} className="text-emerald-400" /> Platform: v1.0.0</span>
          <span>Core API: FastAPI / Python 3.11</span>
        </div>
      </footer>
    </div>
  );
};
