"use client";

import Link from 'next/link';

export default function HelpPage() {
  return (
    <div className="container help-page">
      <div className="header">
        <Link href="/" className="back-btn">← Back to Analysis</Link>
        <div className="tag"><span>📖</span><strong>Help Guide</strong></div>
      </div>

      <div className="card help-hero">
        <h1>Understanding Your Call Analysis</h1>
        <p>This guide explains every metric and score in simple terms. Use this to get the most value from your call analytics.</p>
      </div>

      <nav className="help-nav card">
        <h3>Quick Navigation</h3>
        <div className="nav-links">
          <a href="#overview">📊 Overview</a>
          <a href="#scores">🎯 Scores Explained</a>
          <a href="#metrics">📈 Conversation Metrics</a>
          <a href="#coaching">💪 Coaching Feedback</a>
          <a href="#moments">⚡ Key Moments</a>
          <a href="#predictions">🔮 Predictions</a>
          <a href="#actions">✅ Taking Action</a>
          <a href="#faq">❓ FAQ</a>
        </div>
      </nav>

      {/* Overview Section */}
      <section id="overview" className="card help-section">
        <h2>📊 Overview: What Does This Tool Do?</h2>
        
        <div className="help-content">
          <p><strong>CallTranscribe</strong> is an AI-powered tool that listens to phone calls between your team (agents) and customers/patients, then provides detailed analysis to help you:</p>
          
          <div className="benefit-grid">
            <div className="benefit-card">
              <span className="benefit-icon">📝</span>
              <h4>Transcribe</h4>
              <p>Converts speech to text so you can read what was said without listening to the entire call</p>
            </div>
            <div className="benefit-card">
              <span className="benefit-icon">📊</span>
              <h4>Analyze</h4>
              <p>Measures how well the conversation went using objective metrics</p>
            </div>
            <div className="benefit-card">
              <span className="benefit-icon">🎯</span>
              <h4>Coach</h4>
              <p>Provides specific feedback on what went well and what can be improved</p>
            </div>
            <div className="benefit-card">
              <span className="benefit-icon">🔮</span>
              <h4>Predict</h4>
              <p>Estimates likely outcomes like customer satisfaction and conversion probability</p>
            </div>
          </div>

          <div className="important-note">
            <h4>🔁 Consistency Guarantee</h4>
            <p>The AI uses highly deterministic settings. This means if you analyze the same call twice, you will get very similar (nearly identical) results. This ensures your evaluations are fair and consistent across all calls and agents.</p>
          </div>
        </div>
      </section>

      {/* Scores Explained */}
      <section id="scores" className="card help-section">
        <h2>🎯 Understanding Scores (0-100)</h2>
        
        <div className="help-content">
          <div className="important-note" style={{ background: '#fef3c7', borderColor: '#f59e0b', marginBottom: '20px' }}>
            <h4>⚠️ Strict Evaluation Standard</h4>
            <p>Our AI uses <strong>strict evaluation criteria</strong>. We believe in high standards that drive real improvement. A score of 90+ is rare and exceptional - most good calls score in the 70-80 range. Don&apos;t expect inflated scores; expect honest, actionable feedback.</p>
          </div>

          <p>Throughout the analysis, you will see scores from 0 to 100. Here is what they mean:</p>
          
          <div className="score-guide">
            <div className="score-row exceptional">
              <div className="score-range">90-100</div>
              <div className="score-color" style={{ background: '#22c55e' }}></div>
              <div className="score-meaning">
                <strong>EXCEPTIONAL</strong>
                <p>Truly outstanding. Flawless execution, exceeded expectations, built excellent rapport, no missed opportunities. This is rare and worth celebrating. Use as a training example.</p>
              </div>
            </div>
            <div className="score-row excellent">
              <div className="score-range">80-89</div>
              <div className="score-color" style={{ background: '#7cffc7' }}></div>
              <div className="score-meaning">
                <strong>VERY GOOD</strong>
                <p>Strong performance with only minor issues. The agent did most things right. Reinforce this behavior while noting small areas for polish.</p>
              </div>
            </div>
            <div className="score-row good">
              <div className="score-range">70-79</div>
              <div className="score-color" style={{ background: '#ffd166' }}></div>
              <div className="score-meaning">
                <strong>GOOD</strong>
                <p>Solid performance with some clear improvement areas. This is a competent agent who can grow with targeted coaching.</p>
              </div>
            </div>
            <div className="score-row average">
              <div className="score-range">60-69</div>
              <div className="score-color" style={{ background: '#fbbf24' }}></div>
              <div className="score-meaning">
                <strong>AVERAGE</strong>
                <p>Did the job but nothing special. Several areas need improvement. This agent needs coaching to move to the next level.</p>
              </div>
            </div>
            <div className="score-row below-average">
              <div className="score-range">50-59</div>
              <div className="score-color" style={{ background: '#f97316' }}></div>
              <div className="score-meaning">
                <strong>BELOW AVERAGE</strong>
                <p>Significant issues that need training. Multiple areas require attention. Schedule coaching session soon.</p>
              </div>
            </div>
            <div className="score-row poor">
              <div className="score-range">0-49</div>
              <div className="score-color" style={{ background: '#ff6b6b' }}></div>
              <div className="score-meaning">
                <strong>POOR / NEEDS IMMEDIATE ATTENTION</strong>
                <p>Serious concerns. This call had major issues that need immediate review and correction. Manager escalation recommended.</p>
              </div>
            </div>
          </div>

          <div className="example-box">
            <h4>💡 Why Strict Scoring?</h4>
            <p>Inflated scores feel good but don&apos;t drive improvement. Our strict scoring ensures:</p>
            <ul>
              <li><strong>Honest feedback:</strong> Agents know exactly where they stand</li>
              <li><strong>Room to grow:</strong> Even good agents have areas to improve</li>
              <li><strong>Meaningful progress:</strong> When scores improve, it&apos;s real improvement</li>
              <li><strong>Fair comparison:</strong> Scores are consistent across all calls and agents</li>
            </ul>
          </div>

          <div className="example-box">
            <h4>Example Interpretation</h4>
            <p>If an agent scores <strong>72 in Empathy</strong>, it means they showed good understanding of the customer&apos;s feelings, but there were specific moments where they could have been more supportive. This is a solid score - the agent is competent but has room to become excellent. Check the coaching feedback for specific suggestions on how to move from &ldquo;good&rdquo; to &ldquo;very good.&rdquo;</p>
          </div>
        </div>
      </section>

      {/* Conversation Metrics */}
      <section id="metrics" className="card help-section">
        <h2>📈 Conversation Metrics Explained</h2>
        
        <div className="help-content">
          <p>These are objective measurements about how the conversation flowed. They help identify patterns and issues.</p>
          
          <div className="metric-explainer">
            <div className="metric-item">
              <h4>🗣️ Talk Ratio</h4>
              <div className="metric-visual">
                <div className="ratio-example">
                  <span className="agent-bar">Agent 45%</span>
                  <span className="customer-bar">Customer 45%</span>
                  <span className="silence-bar">Silence 10%</span>
                </div>
              </div>
              <p><strong>What it shows:</strong> How much time each person spent talking during the call.</p>
              <p><strong>Why it matters:</strong> If the agent talks too much (60%+), they may not be listening to the customer. If they talk too little (30% or less), they may not be providing enough value.</p>
              <p><strong>Ideal range:</strong> Agent should speak 40-50% of the time.</p>
            </div>

            <div className="metric-item">
              <h4>❓ Questions Asked</h4>
              <p><strong>Total Questions:</strong> How many questions the agent asked during the call.</p>
              <p><strong>Open Questions:</strong> Questions that require detailed answers. Example: &ldquo;How have you been feeling lately?&rdquo; or &ldquo;What brings you in today?&rdquo;</p>
              <p><strong>Closed Questions:</strong> Questions with yes/no answers. Example: &ldquo;Is the pain constant?&rdquo; or &ldquo;Did you take the medication?&rdquo;</p>
              <p><strong>Why it matters:</strong> Good agents ask more open questions to understand the customer deeply, then use closed questions to confirm specific details.</p>
              <p><strong>Ideal:</strong> More open questions than closed questions, especially early in the call.</p>
            </div>

            <div className="metric-item">
              <h4>🔇 Interruptions</h4>
              <p><strong>What it shows:</strong> How many times someone started speaking while the other person was still talking.</p>
              <p><strong>Why it matters:</strong> Frequent agent interruptions suggest poor listening skills and can frustrate customers. Customer interruptions may indicate confusion or strong emotions.</p>
              <p><strong>Ideal:</strong> Less than 3 interruptions by the agent per call.</p>
            </div>

            <div className="metric-item">
              <h4>⏱️ Response Time</h4>
              <p><strong>Average Response Time:</strong> How quickly the agent responds after the customer finishes speaking.</p>
              <p><strong>Why it matters:</strong> Too fast (under 1 second) suggests the agent isn&apos;t fully listening. Too slow (over 4 seconds) creates awkward silences.</p>
              <p><strong>Ideal:</strong> 1-3 seconds response time.</p>
            </div>

            <div className="metric-item">
              <h4>🏃 Words Per Minute (WPM)</h4>
              <p><strong>What it shows:</strong> Speaking speed of both the agent and customer.</p>
              <p><strong>Why it matters:</strong> Speaking too fast (180+ WPM) makes it hard for customers to follow. Speaking too slow (under 100 WPM) can seem disengaged.</p>
              <p><strong>Ideal:</strong> 120-150 WPM for professional conversations.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Conversation Segments */}
      <section className="card help-section">
        <h2>📍 Conversation Flow Segments</h2>
        
        <div className="help-content">
          <p>Every good call follows a natural structure. The analysis breaks down the call into these phases:</p>
          
          <div className="segment-explainer">
            <div className="segment-item">
              <div className="segment-number">1</div>
              <div className="segment-content">
                <h4>Greeting / Opening</h4>
                <p>The first few seconds where the agent introduces themselves and sets the tone.</p>
                <p><strong>Good example:</strong> &ldquo;Good morning! Thank you for calling ABC Clinic. My name is Priya. How may I help you today?&rdquo;</p>
                <p><strong>What to look for:</strong> Warm, professional, includes name, asks how to help.</p>
              </div>
            </div>

            <div className="segment-item">
              <div className="segment-number">2</div>
              <div className="segment-content">
                <h4>Discovery</h4>
                <p>Understanding what the customer needs through questions and active listening.</p>
                <p><strong>Good example:</strong> Asking about symptoms, duration, previous treatments, lifestyle factors.</p>
                <p><strong>What to look for:</strong> Open questions, paraphrasing to confirm understanding, empathy.</p>
              </div>
            </div>

            <div className="segment-item">
              <div className="segment-number">3</div>
              <div className="segment-content">
                <h4>Solution / Recommendation</h4>
                <p>Presenting options, explaining treatments, or providing information.</p>
                <p><strong>Good example:</strong> Clearly explaining what the treatment involves, expected outcomes, and costs.</p>
                <p><strong>What to look for:</strong> Clear language (no jargon), checking for understanding, addressing concerns.</p>
              </div>
            </div>

            <div className="segment-item">
              <div className="segment-number">4</div>
              <div className="segment-content">
                <h4>Objection Handling</h4>
                <p>Addressing concerns, questions, or hesitations the customer raises.</p>
                <p><strong>Good example:</strong> &ldquo;I understand the cost is a concern. Let me explain our payment options...&rdquo;</p>
                <p><strong>What to look for:</strong> Acknowledging the concern, providing reassurance, offering alternatives.</p>
              </div>
            </div>

            <div className="segment-item">
              <div className="segment-number">5</div>
              <div className="segment-content">
                <h4>Closing</h4>
                <p>Wrapping up with clear next steps and a professional goodbye.</p>
                <p><strong>Good example:</strong> &ldquo;So you&apos;re confirmed for Thursday at 3 PM. We&apos;ll send you a reminder. Is there anything else I can help with?&rdquo;</p>
                <p><strong>What to look for:</strong> Summarizing agreed actions, confirming details, offering additional help.</p>
              </div>
            </div>
          </div>

          <p className="quality-note">Each segment is rated as <span className="quality-label excellent">Excellent</span>, <span className="quality-label good">Good</span>, <span className="quality-label average">Average</span>, or <span className="quality-label poor">Poor</span> based on how well it was executed.</p>
        </div>
      </section>

      {/* Coaching Feedback */}
      <section id="coaching" className="card help-section">
        <h2>💪 Coaching Feedback Categories</h2>
        
        <div className="help-content">
          <p>The AI evaluates the agent across multiple skills. Here&apos;s what each category measures:</p>
          
          <div className="coaching-categories">
            <div className="category-item">
              <h4>👋 Opening</h4>
              <p>How well did the agent start the call? Did they introduce themselves, sound welcoming, and set a positive tone?</p>
            </div>

            <div className="category-item">
              <h4>🔍 Discovery</h4>
              <p>How effectively did the agent understand the customer&apos;s needs? Did they ask good questions and listen actively?</p>
            </div>

            <div className="category-item">
              <h4>💡 Solution Presentation</h4>
              <p>How clearly did the agent explain options or recommendations? Was the information relevant and easy to understand?</p>
            </div>

            <div className="category-item">
              <h4>🤝 Objection Handling</h4>
              <p>When the customer raised concerns, how well did the agent address them? Did they acknowledge and resolve the issues?</p>
            </div>

            <div className="category-item">
              <h4>🎯 Closing</h4>
              <p>How effectively did the agent wrap up? Were next steps clear? Did they ask if anything else was needed?</p>
            </div>

            <div className="category-item">
              <h4>❤️ Empathy</h4>
              <p>Did the agent show understanding of the customer&apos;s feelings and situation? Did they acknowledge emotions appropriately?</p>
            </div>

            <div className="category-item">
              <h4>🔊 Clarity</h4>
              <p>Was the agent easy to understand? Did they avoid jargon and explain things simply?</p>
            </div>

            <div className="category-item">
              <h4>✅ Compliance</h4>
              <p>Did the agent follow required protocols? Did they make proper disclosures and avoid misinformation?</p>
            </div>
          </div>

          <div className="feedback-sections">
            <h3>Types of Feedback Provided</h3>
            
            <div className="feedback-type good">
              <h4>✅ Strengths</h4>
              <p>Things the agent did well. Use these as examples of good behavior to reinforce in training.</p>
            </div>

            <div className="feedback-type improve">
              <h4>⚠️ Areas for Improvement</h4>
              <p>Specific things that could be done better. Focus training on these areas.</p>
            </div>

            <div className="feedback-type missed">
              <h4>💡 Missed Opportunities</h4>
              <p>Chances to help the customer better or close a sale that were not taken. Learn from these for future calls.</p>
            </div>

            <div className="feedback-type scripts">
              <h4>📝 Script Recommendations</h4>
              <p>Suggested phrases the agent could use in similar situations. These can be copied and practiced.</p>
            </div>

            <div className="feedback-type red">
              <h4>🚨 Red Flags</h4>
              <p>Serious issues that need immediate attention - like rude behavior, misinformation, or compliance violations.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Key Moments */}
      <section id="moments" className="card help-section">
        <h2>⚡ Key Moments Explained</h2>
        
        <div className="help-content">
          <p>The AI identifies important moments during the call that deserve attention. Here are the types of moments detected:</p>
          
          <div className="moments-grid">
            <div className="moment-type-item">
              <span className="moment-icon-large">😤</span>
              <h4>Complaint</h4>
              <p>Customer expressed frustration, dissatisfaction, or a problem. These need careful handling.</p>
            </div>

            <div className="moment-type-item">
              <span className="moment-icon-large">😊</span>
              <h4>Compliment</h4>
              <p>Customer said something positive about the service, agent, or company. Great for morale!</p>
            </div>

            <div className="moment-type-item">
              <span className="moment-icon-large">🤔</span>
              <h4>Objection</h4>
              <p>Customer raised a concern or hesitation. How these are handled often determines the outcome.</p>
            </div>

            <div className="moment-type-item">
              <span className="moment-icon-large">🏢</span>
              <h4>Competitor Mention</h4>
              <p>Customer mentioned another company or service. Useful for competitive intelligence.</p>
            </div>

            <div className="moment-type-item">
              <span className="moment-icon-large">💰</span>
              <h4>Pricing Discussion</h4>
              <p>Money, costs, or pricing came up. Important for sales and objection handling analysis.</p>
            </div>

            <div className="moment-type-item">
              <span className="moment-icon-large">✅</span>
              <h4>Commitment</h4>
              <p>Customer agreed to something - an appointment, treatment, purchase, etc. Positive signal!</p>
            </div>

            <div className="moment-type-item">
              <span className="moment-icon-large">💡</span>
              <h4>Breakthrough</h4>
              <p>Customer had an &ldquo;aha moment&rdquo; where they understood something important.</p>
            </div>

            <div className="moment-type-item">
              <span className="moment-icon-large">⚠️</span>
              <h4>Escalation Risk</h4>
              <p>Moment where the situation could escalate into a formal complaint if not handled well.</p>
            </div>
          </div>

          <div className="importance-guide">
            <h4>Importance Levels</h4>
            <p>Each moment is tagged with importance:</p>
            <ul>
              <li><span className="importance high">HIGH</span> - Requires immediate attention or action</li>
              <li><span className="importance medium">MEDIUM</span> - Worth noting and addressing</li>
              <li><span className="importance low">LOW</span> - Minor point for awareness</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Predictions */}
      <section id="predictions" className="card help-section">
        <h2>🔮 Understanding Predictions</h2>
        
        <div className="help-content">
          <p>Based on the conversation, the AI predicts likely outcomes. These are educated guesses, not guarantees.</p>
          
          <div className="prediction-explainer">
            <div className="pred-item-large">
              <h4>📈 Conversion Probability</h4>
              <p><strong>What it means:</strong> How likely is the customer to take the desired action (book appointment, sign up, purchase)?</p>
              <p><strong>High (70-100%):</strong> Customer showed strong interest, agreed to next steps, seemed satisfied.</p>
              <p><strong>Medium (40-69%):</strong> Some interest but also hesitation. May need follow-up.</p>
              <p><strong>Low (0-39%):</strong> Significant barriers exist. Needs more work to convert.</p>
            </div>

            <div className="pred-item-large">
              <h4>🚪 Churn Risk</h4>
              <p><strong>What it means:</strong> How likely is the customer to leave or not return?</p>
              <p><strong>High Risk:</strong> Customer expressed strong dissatisfaction, unresolved issues, or intent to leave. Act immediately.</p>
              <p><strong>Medium Risk:</strong> Some concerns but not critical. Follow up to ensure satisfaction.</p>
              <p><strong>Low Risk:</strong> Customer seems happy and likely to return.</p>
            </div>

            <div className="pred-item-large">
              <h4>📢 Escalation Risk</h4>
              <p><strong>What it means:</strong> How likely is this to become a formal complaint?</p>
              <p><strong>High Risk:</strong> Customer was very upset, threatened to complain, or issue was not resolved. Manager should review.</p>
              <p><strong>Medium/Low Risk:</strong> Normal interaction with no significant escalation potential.</p>
            </div>

            <div className="pred-item-large">
              <h4>😊 Satisfaction Prediction</h4>
              <p><strong>What it means:</strong> How satisfied is the customer likely to be based on this interaction?</p>
              <p>This combines sentiment, issue resolution, agent behavior, and conversation flow to estimate overall satisfaction.</p>
            </div>
          </div>

          <div className="prediction-note">
            <h4>📝 Important Note</h4>
            <p>Predictions are based on patterns in the conversation. They are not 100% accurate. Use them as guidance for prioritizing follow-ups and identifying at-risk customers, but always apply human judgment.</p>
          </div>
        </div>
      </section>

      {/* Taking Action */}
      <section id="actions" className="card help-section">
        <h2>✅ Taking Action on Analysis</h2>
        
        <div className="help-content">
          <h3>For Individual Calls</h3>
          <ol className="action-steps">
            <li><strong>Listen while reading:</strong> Play the audio while reviewing the analysis to understand context better.</li>
            <li><strong>Check key moments:</strong> Jump to flagged moments to understand critical parts of the conversation.</li>
            <li><strong>Review coaching scores:</strong> Identify which categories need the most improvement.</li>
            <li><strong>Note action items:</strong> Follow up on any tasks generated from the call.</li>
            <li><strong>Share script recommendations:</strong> If there are good suggested phrases, share them with the agent.</li>
          </ol>

          <h3>For Team Performance</h3>
          <ol className="action-steps">
            <li><strong>Compare average scores:</strong> Track team average over time to see if training is working.</li>
            <li><strong>Identify common issues:</strong> Look at most frequent weaknesses across all calls.</li>
            <li><strong>Celebrate wins:</strong> Highlight calls with high scores as examples.</li>
            <li><strong>Address red flags:</strong> Any call with red flags should be reviewed immediately.</li>
            <li><strong>Focus training:</strong> Use common weaknesses to design targeted training programs.</li>
          </ol>

          <h3>When to Escalate</h3>
          <ul className="escalation-guide">
            <li>🚨 Any call with <strong>Red Flags</strong></li>
            <li>⚠️ Calls with <strong>High Escalation Risk</strong></li>
            <li>📉 Scores below <strong>50 overall</strong></li>
            <li>😤 Multiple <strong>complaint moments</strong> in one call</li>
            <li>🔁 Same agent having issues across <strong>multiple calls</strong></li>
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="card help-section">
        <h2>❓ Frequently Asked Questions</h2>
        
        <div className="help-content faq-list">
          <div className="faq-item">
            <h4>Will I get the same results if I analyze the same call twice?</h4>
            <p>Yes! The AI uses very consistent settings (low temperature), so analyzing the same call multiple times will produce nearly identical results. This ensures fair and consistent evaluations.</p>
          </div>

          <div className="faq-item">
            <h4>Can the AI understand Hindi and mixed languages?</h4>
            <p>Yes. The AI understands English, Hindi, and mixed Hindi-English (Hinglish) conversations, which is common in Indian healthcare and business contexts.</p>
          </div>

          <div className="faq-item">
            <h4>How accurate are the predictions?</h4>
            <p>Predictions are based on patterns in conversation and are generally reliable, but they are estimates, not guarantees. Use them to prioritize actions, not as absolute truths.</p>
          </div>

          <div className="faq-item">
            <h4>What if the transcription has errors?</h4>
            <p>AI transcription is highly accurate but not perfect, especially with poor audio quality, heavy accents, or background noise. Always use the audio player to verify critical parts.</p>
          </div>

          <div className="faq-item">
            <h4>How long does analysis take?</h4>
            <p>Typically 30-60 seconds per call, depending on the length. Longer calls take more time.</p>
          </div>

          <div className="faq-item">
            <h4>Can I export the analysis?</h4>
            <p>Yes! You can export the full analysis as JSON, the transcript as text, or the coaching report separately. Use the export buttons on the analysis page.</p>
          </div>

          <div className="faq-item">
            <h4>What file formats are supported?</h4>
            <p>Most common audio formats: MP3, WAV, M4A, AAC, OGG, FLAC, MPEG, and WebM. Files should be under 20MB.</p>
          </div>
        </div>
      </section>

      <div className="card help-footer">
        <h3>Need More Help?</h3>
        <p>Contact your administrator or the CallTranscribe support team for additional assistance.</p>
        <Link href="/" className="btn primary-btn">Start Analyzing Calls →</Link>
      </div>
    </div>
  );
}


