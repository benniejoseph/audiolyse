"use client";

import Link from 'next/link';
import { ArrowLeft, Book, BarChart3, Target, MessageSquare, Zap, Activity, Info, HelpCircle } from 'lucide-react';

export default function HelpPage() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link 
            href="/analyze" 
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Analysis
          </Link>
          <div className="flex items-center gap-2 text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100">
            <Book className="w-4 h-4" />
            <span className="text-sm font-semibold">Help Guide</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Sidebar Navigation - Sticky on Desktop */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sticky top-24">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Quick Navigation</h3>
              <nav className="space-y-1">
                {[
                  { id: 'overview', icon: BarChart3, label: 'Overview' },
                  { id: 'scores', icon: Target, label: 'Scores Explained' },
                  { id: 'metrics', icon: Activity, label: 'Conversation Metrics' },
                  { id: 'coaching', icon: MessageSquare, label: 'Coaching Feedback' },
                  { id: 'moments', icon: Zap, label: 'Key Moments' },
                  { id: 'predictions', icon: HelpCircle, label: 'Predictions' },
                  { id: 'actions', icon: Info, label: 'Taking Action' }
                ].map((item) => (
                  <button 
                    key={item.id}
                    onClick={() => scrollToSection(item.id)} 
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-600 hover:text-indigo-600 hover:bg-gray-50 rounded-lg transition-colors text-left group"
                  >
                    <item.icon className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 transition-colors" /> 
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-9 space-y-12">
            
            {/* Hero Section */}
            <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl p-8 text-white shadow-lg">
              <div className="relative z-10">
                <h1 className="text-3xl font-bold mb-4">Understanding Your Call Analysis</h1>
                <p className="text-indigo-100 text-lg max-w-2xl leading-relaxed">
                  This guide explains every metric and score in simple terms. Use this to get the most value from your call analytics and improve team performance.
                </p>
              </div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-900 opacity-20 rounded-full blur-2xl translate-y-1/4 -translate-x-1/4"></div>
            </div>

            {/* Overview Section */}
            <section id="overview" className="scroll-mt-24">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <span className="p-2 bg-blue-100 text-blue-600 rounded-lg shadow-sm"><BarChart3 className="w-6 h-6" /></span>
                Overview: What Does This Tool Do?
              </h2>
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
                <p className="text-gray-600 leading-relaxed text-lg">
                  <strong className="text-gray-900 font-semibold">Audiolyse</strong> is an AI-powered call analysis platform that listens to calls between agents and customers, providing detailed insights to help you transcribe, analyze, coach, and predict outcomes.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { icon: "📝", title: "Transcribe", desc: "Converts speech to text so you can read what was said without listening to the entire call" },
                    { icon: "📊", title: "Analyze", desc: "Measures how well the conversation went using objective metrics like talk ratio and interruptions" },
                    { icon: "🎯", title: "Coach", desc: "Provides specific feedback on what went well and what can be improved for agent growth" },
                    { icon: "🔮", title: "Predict", desc: "Estimates likely outcomes like customer satisfaction, churn risk, and conversion probability" }
                  ].map((item, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-xl p-5 border border-gray-100 hover:border-indigo-100 hover:shadow-md transition-all">
                      <span className="text-2xl mb-3 block">{item.icon}</span>
                      <h4 className="font-semibold text-gray-900 mb-2">{item.title}</h4>
                      <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-lg p-5 flex gap-4">
                  <div className="text-2xl flex-shrink-0">🔁</div>
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-1">Consistency Guarantee</h4>
                    <p className="text-sm text-blue-800 leading-relaxed">
                      The AI uses highly deterministic settings. This means if you analyze the same call twice, you will get very similar results. This ensures your evaluations are fair and consistent across all calls and agents.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Scores Explained */}
            <section id="scores" className="scroll-mt-24">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <span className="p-2 bg-green-100 text-green-600 rounded-lg shadow-sm"><Target className="w-6 h-6" /></span>
                Understanding Scores (0-100)
              </h2>
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-8">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-5 flex gap-4">
                  <div className="text-2xl flex-shrink-0">⚠️</div>
                  <div>
                    <h4 className="font-semibold text-amber-900 mb-1">Strict Evaluation Standard</h4>
                    <p className="text-sm text-amber-800 leading-relaxed">
                      Our AI uses <strong>strict evaluation criteria</strong>. A score of 90+ is rare and exceptional. Most good calls score in the 70-80 range. Expect honest, actionable feedback rather than inflated scores.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    { range: "90-100", label: "EXCEPTIONAL", color: "bg-green-500", desc: "Truly outstanding. Flawless execution, exceeded expectations, built excellent rapport. Use as a training example." },
                    { range: "80-89", label: "VERY GOOD", color: "bg-green-400", desc: "Strong performance with only minor issues. The agent did most things right. Reinforce this behavior." },
                    { range: "70-79", label: "GOOD", color: "bg-yellow-400", desc: "Solid performance with some clear improvement areas. This is a competent agent who can grow." },
                    { range: "60-69", label: "AVERAGE", color: "bg-yellow-500", desc: "Did the job but nothing special. Several areas need improvement. Needs coaching." },
                    { range: "50-59", label: "BELOW AVERAGE", color: "bg-orange-500", desc: "Significant issues that need training. Multiple areas require attention." },
                    { range: "0-49", label: "POOR", color: "bg-red-500", desc: "Serious concerns. Major issues that need immediate review and correction. Manager escalation recommended." }
                  ].map((score, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors group">
                      <div className="sm:w-32 flex-shrink-0 flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${score.color} ring-4 ring-opacity-20 ${score.color.replace('bg-', 'ring-')}`}></div>
                        <span className="font-mono font-bold text-gray-900 text-lg">{score.range}</span>
                      </div>
                      <div>
                        <strong className={`text-xs font-bold px-2 py-1 rounded bg-gray-100 ${
                          score.label.includes('POOR') || score.label.includes('BELOW') 
                            ? 'text-red-700 bg-red-50' 
                            : score.label === 'AVERAGE' 
                              ? 'text-yellow-700 bg-yellow-50'
                              : 'text-green-700 bg-green-50'
                        }`}>{score.label}</strong>
                        <p className="text-sm text-gray-600 mt-2 leading-relaxed">{score.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">💡 Example Interpretation</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    If an agent scores <strong>82 in Clarity</strong>, it means they spoke clearly and were easy to understand, but perhaps used one or two jargon terms that could be simplified. This is a very good score.
                  </p>
                </div>
              </div>
            </section>

            {/* Conversation Metrics */}
            <section id="metrics" className="scroll-mt-24">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <span className="p-2 bg-indigo-100 text-indigo-600 rounded-lg shadow-sm"><Activity className="w-6 h-6" /></span>
                Conversation Metrics Explained
              </h2>
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden divide-y divide-gray-100">
                {[
                  { title: "🗣️ Talk Ratio", desc: "How much time each person spent talking.", ideal: "Agent shouldn't dominate (>60%). Listen more.", icon: "bg-blue-50 text-blue-600" },
                  { title: "❓ Questions Asked", desc: "Balance of Open vs Closed questions.", ideal: "More open questions (requiring detailed answers) than closed (yes/no).", icon: "bg-purple-50 text-purple-600" },
                  { title: "🔇 Interruptions", desc: "When someone speaks over the other.", ideal: "Less than 3 interruptions by the agent per call.", icon: "bg-red-50 text-red-600" },
                  { title: "⏱️ Response Time", desc: "Pause before responding.", ideal: "1-3 seconds. Too fast = not listening; Too slow = awkward silence.", icon: "bg-amber-50 text-amber-600" },
                  { title: "🏃 Words Per Minute", desc: "Speaking speed.", ideal: "120-150 WPM. Too fast (>180) is hard to follow.", icon: "bg-green-50 text-green-600" }
                ].map((metric, idx) => (
                  <div key={idx} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">{metric.title}</h4>
                        <p className="text-gray-500 text-sm">{metric.desc}</p>
                      </div>
                      <div className="flex-shrink-0 bg-indigo-50 px-4 py-2 rounded-lg text-xs font-medium text-indigo-700 border border-indigo-100">
                        <span className="block text-indigo-400 text-[10px] uppercase font-bold tracking-wider mb-0.5">Target</span>
                         {metric.ideal}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Coaching Feedback */}
            <section id="coaching" className="scroll-mt-24">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <span className="p-2 bg-pink-100 text-pink-600 rounded-lg shadow-sm"><MessageSquare className="w-6 h-6" /></span>
                Coaching Feedback Categories
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col h-full">
                  <h3 className="font-semibold text-gray-900 mb-4 border-b border-gray-100 pb-3">Skills Evaluated</h3>
                  <div className="space-y-4 flex-1">
                    {[
                      ["👋 Opening", "First impressions, tone, and introduction."],
                      ["🔍 Discovery", "Asking the right questions to understand needs."],
                      ["💡 Solution", "Explaining options clearly and relevantly."],
                      ["🤝 Objections", "Handling concerns and hesitations."],
                      ["🎯 Closing", "Clear next steps and professional wrap-up."],
                      ["❤️ Empathy", "Emotional intelligence and validation."],
                      ["🔊 Clarity", "Communication style, no jargon."],
                      ["✅ Compliance", "Following protocols and required scripts."]
                    ].map(([title, desc], i) => (
                      <div key={i} className="group">
                        <h4 className="font-medium text-gray-900 text-sm group-hover:text-indigo-600 transition-colors">{title}</h4>
                        <p className="text-xs text-gray-500">{desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col h-full">
                  <h3 className="font-semibold text-gray-900 mb-4 border-b border-gray-100 pb-3">Feedback Types</h3>
                  <div className="space-y-6 flex-1">
                    <div className="flex gap-4 p-3 bg-green-50 rounded-lg border border-green-100">
                      <div className="text-xl">✅</div>
                      <div>
                        <h4 className="text-sm font-bold text-green-900">Strengths</h4>
                        <p className="text-xs text-green-800 mt-1">Behaviors to reinforce. &quot;Great job validating their feelings.&quot;</p>
                      </div>
                    </div>
                    <div className="flex gap-4 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                      <div className="text-xl">⚠️</div>
                      <div>
                        <h4 className="text-sm font-bold text-yellow-900">Improvements</h4>
                        <p className="text-xs text-yellow-800 mt-1">Specific areas to focus training. &quot;Try to pause more often.&quot;</p>
                      </div>
                    </div>
                    <div className="flex gap-4 p-3 bg-red-50 rounded-lg border border-red-100">
                      <div className="text-xl">🚨</div>
                      <div>
                        <h4 className="text-sm font-bold text-red-900">Red Flags</h4>
                        <p className="text-xs text-red-800 mt-1">Critical issues like rudeness or compliance failures.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Key Moments */}
            <section id="moments" className="scroll-mt-24">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <span className="p-2 bg-orange-100 text-orange-600 rounded-lg shadow-sm"><Zap className="w-6 h-6" /></span>
                Key Moments
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  ["😤", "Complaint", "bg-red-50 border-red-100 text-red-700"],
                  ["😊", "Compliment", "bg-green-50 border-green-100 text-green-700"],
                  ["🤔", "Objection", "bg-orange-50 border-orange-100 text-orange-700"],
                  ["🏢", "Competitor", "bg-gray-50 border-gray-200 text-gray-700"],
                  ["💰", "Pricing", "bg-yellow-50 border-yellow-100 text-yellow-700"],
                  ["✅", "Commitment", "bg-green-50 border-green-100 text-green-700"],
                  ["💡", "Breakthrough", "bg-blue-50 border-blue-100 text-blue-700"],
                  ["⚠️", "Escalation", "bg-red-50 border-red-100 text-red-700"]
                ].map(([emoji, label, classes], i) => (
                  <div key={i} className={`rounded-xl p-4 border text-center transition-transform hover:-translate-y-1 ${classes}`}>
                    <div className="text-3xl mb-2">{emoji}</div>
                    <div className="text-sm font-semibold">{label}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* FAQ */}
            <section id="faq" className="scroll-mt-24 mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <span className="p-2 bg-gray-100 text-gray-600 rounded-lg shadow-sm"><HelpCircle className="w-6 h-6" /></span>
                FAQ
              </h2>
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-100">
                {[
                  ["Will I get the same results if I analyze the same call twice?", "Yes! The AI uses consistent settings to ensure fair evaluations."],
                  ["Can the AI understand different languages?", "It handles English, Hindi, and mixed languages (Hinglish) effectively, focusing on context."],
                  ["How accurate are the predictions?", "They are estimated patterns, not guarantees. Use them as guidance for prioritization."],
                  ["Can I export the analysis?", "Yes, you can export PDF reports, JSON data, or the raw transcript text."],
                  ["What audio formats are supported?", "We support MP3, WAV, M4A, AAC, OGG, and most common audio formats up to 25MB."]
                ].map(([q, a], i) => (
                  <div key={i} className="p-5 hover:bg-gray-50 transition-colors">
                    <h4 className="font-semibold text-gray-900 text-sm mb-2">{q}</h4>
                    <p className="text-gray-600 text-sm leading-relaxed">{a}</p>
                  </div>
                ))}
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
