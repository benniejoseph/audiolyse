'use client';

import Link from 'next/link';
import { Logo } from '@/components/Logo';

export default function DeliveryPolicyPage() {
  return (
    <div className="legal-page">
      <header className="legal-header">
        <Link href="/" className="legal-logo">
          <Logo size="lg" />
        </Link>
        <nav className="legal-nav">
          <Link href="/">Home</Link>
          <Link href="/contact">Contact</Link>
        </nav>
      </header>

      <main className="legal-content">
        <div className="legal-container">
          <h1>Service Delivery Policy</h1>
          <p className="legal-updated">Last Updated: December 9, 2024</p>

          <section>
            <h2>1. Service Delivery Overview</h2>
            <p>
              Audiolyse is a Software-as-a-Service (SaaS) platform delivered entirely online. This policy outlines how our services are delivered, activated, and accessed.
            </p>
          </section>

          <section>
            <h2>2. Account Activation and Access</h2>
            
            <h3>2.1 Immediate Access</h3>
            <ul>
              <li>Upon successful registration, you receive immediate access to the Free tier</li>
              <li>Account activation is automatic and typically occurs within seconds</li>
              <li>You can begin using the Service immediately after account creation</li>
            </ul>

            <h3>2.2 Paid Subscription Activation</h3>
            <ul>
              <li>Paid subscriptions are activated immediately upon successful payment</li>
              <li>Upgrade to paid features occurs instantly after payment confirmation</li>
              <li>You will receive a confirmation email with subscription details</li>
              <li>If payment fails, you will be notified and can retry the payment</li>
            </ul>

            <h3>2.3 Access Method</h3>
            <p>
              The Service is accessed through:
            </p>
            <ul>
              <li>Web browser (Chrome, Firefox, Safari, Edge - latest versions recommended)</li>
              <li>No software installation required</li>
              <li>Mobile-responsive design for tablet and mobile access</li>
            </ul>
          </section>

          <section>
            <h2>3. Service Availability</h2>
            
            <h3>3.1 Uptime Commitment</h3>
            <ul>
              <li>We strive to maintain 99.9% service availability</li>
              <li>Service is available 24/7, except during scheduled maintenance</li>
              <li>We monitor service health continuously</li>
            </ul>

            <h3>3.2 Scheduled Maintenance</h3>
            <ul>
              <li>Maintenance windows are scheduled during low-traffic periods when possible</li>
              <li>We provide advance notice of planned maintenance (typically 24-48 hours)</li>
              <li>Maintenance notifications are sent via email and displayed in the application</li>
              <li>Emergency maintenance may occur without advance notice</li>
            </ul>

            <h3>3.3 Service Interruptions</h3>
            <p>
              In the event of unplanned service interruptions:
            </p>
            <ul>
              <li>We work to restore service as quickly as possible</li>
              <li>Status updates are provided on our status page (if available) and via email</li>
              <li>Extended outages may result in service credits as outlined in our Terms of Service</li>
            </ul>
          </section>

          <section>
            <h2>4. Analysis Processing and Delivery</h2>
            
            <h3>4.1 Analysis Processing Time</h3>
            <ul>
              <li><strong>Standard Analysis:</strong> Typically completed within 2-5 minutes per call</li>
              <li><strong>Bulk Analysis:</strong> Processed sequentially; time depends on number of files</li>
              <li><strong>File Size Limits:</strong> Maximum file size varies by subscription tier</li>
              <li><strong>Format Support:</strong> MP3, WAV, M4A, MPEG, OGG, WebM</li>
            </ul>

            <h3>4.2 Analysis Results Delivery</h3>
            <ul>
              <li>Results are available immediately upon completion in your account</li>
              <li>You receive email notifications when analysis is complete</li>
              <li>Results include: transcription, coaching scores, metrics, insights, and PDF reports</li>
              <li>All results are stored in your account for future access</li>
            </ul>

            <h3>4.3 Processing Delays</h3>
            <p>
              Processing may be delayed due to:
            </p>
            <ul>
              <li>High system load or traffic</li>
              <li>Large file sizes or complex audio</li>
              <li>Technical issues with third-party AI services</li>
              <li>Network connectivity issues</li>
            </ul>
            <p>
              We will notify you if processing takes longer than expected.
            </p>
          </section>

          <section>
            <h2>5. Feature Updates and Enhancements</h2>
            
            <h3>5.1 Continuous Updates</h3>
            <ul>
              <li>New features and improvements are deployed regularly</li>
              <li>Updates are delivered automatically - no action required from you</li>
              <li>Major feature releases are announced via email and in-app notifications</li>
            </ul>

            <h3>5.2 Feature Availability</h3>
            <ul>
              <li>Feature availability depends on your subscription tier</li>
              <li>New features may be introduced gradually to different tiers</li>
              <li>Enterprise customers may receive early access to new features</li>
            </ul>
          </section>

          <section>
            <h2>6. Data Delivery and Storage</h2>
            
            <h3>6.1 Data Storage</h3>
            <ul>
              <li>All data is stored securely in cloud infrastructure</li>
              <li>Data is backed up regularly to ensure availability</li>
              <li>Storage limits vary by subscription tier</li>
            </ul>

            <h3>6.2 Data Export</h3>
            <ul>
              <li>You can export your analysis data at any time</li>
              <li>Export formats include: PDF reports, JSON data, TXT transcripts</li>
              <li>Bulk export options are available for Enterprise customers</li>
            </ul>

            <h3>6.3 Data Retention</h3>
            <ul>
              <li>Data retention periods vary by subscription tier</li>
              <li>Free tier: Limited retention (typically 30 days)</li>
              <li>Paid tiers: Extended retention based on plan</li>
              <li>You can request data deletion at any time</li>
            </ul>
          </section>

          <section>
            <h2>7. Support and Assistance</h2>
            
            <h3>7.1 Support Channels</h3>
            <ul>
              <li><strong>Email Support:</strong> Available to all users at <a href="mailto:support@audiolyse.com">support@audiolyse.com</a></li>
              <li><strong>Help Center:</strong> Access documentation and guides at <Link href="/help">/help</Link></li>
              <li><strong>Contact Form:</strong> Use our <Link href="/contact">contact form</Link> for inquiries</li>
            </ul>

            <h3>7.2 Response Times</h3>
            <ul>
              <li><strong>Free Tier:</strong> Best effort (typically 48-72 hours)</li>
              <li><strong>Individual/Team:</strong> Within 24-48 hours</li>
              <li><strong>Enterprise:</strong> Priority support with faster response times</li>
            </ul>
          </section>

          <section>
            <h2>8. System Requirements</h2>
            
            <h3>8.1 Browser Requirements</h3>
            <ul>
              <li>Modern web browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)</li>
              <li>JavaScript enabled</li>
              <li>Cookies enabled for authentication</li>
            </ul>

            <h3>8.2 Network Requirements</h3>
            <ul>
              <li>Stable internet connection for uploading files and accessing results</li>
              <li>Minimum bandwidth: 1 Mbps for standard use</li>
              <li>Higher bandwidth recommended for bulk uploads</li>
            </ul>

            <h3>8.3 Device Compatibility</h3>
            <ul>
              <li>Desktop computers (Windows, macOS, Linux)</li>
              <li>Tablets (iPad, Android tablets)</li>
              <li>Mobile devices (iOS, Android) - limited functionality</li>
            </ul>
          </section>

          <section>
            <h2>9. Service Limitations</h2>
            <ul>
              <li>Service availability may vary by geographic region</li>
              <li>Some features may not be available in all countries</li>
              <li>Processing times may vary based on system load</li>
              <li>File upload limits apply based on subscription tier</li>
            </ul>
          </section>

          <section>
            <h2>10. Contact for Delivery Issues</h2>
            <p>
              If you experience issues with service delivery, activation, or access:
            </p>
            <ul>
              <li><strong>Email:</strong> <a href="mailto:support@audiolyse.com">support@audiolyse.com</a></li>
              <li><strong>Website:</strong> <Link href="/contact">Contact Us</Link></li>
              <li>Include your account email and description of the issue for faster resolution</li>
            </ul>
          </section>
        </div>
      </main>

      <footer className="legal-footer">
        <div className="legal-footer-links">
          <Link href="/terms">Terms of Service</Link>
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/cancellation-refunds">Cancellation & Refunds</Link>
          <Link href="/contact">Contact</Link>
        </div>
        <p>&copy; 2024 Audiolyse. All rights reserved.</p>
      </footer>
    </div>
  );
}

