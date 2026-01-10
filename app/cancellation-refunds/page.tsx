'use client';

import Link from 'next/link';
import { Logo } from '@/components/Logo';

export default function CancellationRefundsPage() {
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
          <h1>Cancellation & Refunds Policy</h1>
          <p className="legal-updated">Last Updated: December 9, 2024</p>

          <section>
            <h2>1. Subscription Cancellation</h2>
            
            <h3>1.1 How to Cancel</h3>
            <p>You may cancel your subscription at any time through:</p>
            <ul>
              <li><strong>Account Settings:</strong> Navigate to Settings → Subscription → Cancel Subscription</li>
              <li><strong>Email:</strong> Send a cancellation request to <a href="mailto:support@audiolyse.com">support@audiolyse.com</a></li>
              <li><strong>Contact Form:</strong> Use our <Link href="/contact">contact form</Link> with your cancellation request</li>
            </ul>

            <h3>1.2 Cancellation Effective Date</h3>
            <ul>
              <li>Cancellation takes effect at the end of your current billing period</li>
              <li>You will continue to have access to all features until the end of the paid period</li>
              <li>No partial refunds are provided for unused time in the current billing period</li>
              <li>After cancellation, your account will be downgraded to the Free tier (if eligible) or deactivated</li>
            </ul>

            <h3>1.3 Immediate Cancellation</h3>
            <p>
              If you request immediate cancellation, your subscription will end immediately, and you will lose access to paid features. No refund will be provided for the remaining billing period.
            </p>
          </section>

          <section>
            <h2>2. Refund Policy</h2>
            
            <h3>2.1 General Refund Terms</h3>
            <p>
              All subscription fees are generally non-refundable. However, we may provide refunds in the following circumstances:
            </p>

            <h3>2.2 Eligible Refunds</h3>
            <ul>
              <li>
                <strong>Service Failure:</strong> If we are unable to provide the Service due to technical issues on our end for more than 48 hours, you may be eligible for a prorated refund
              </li>
              <li>
                <strong>Duplicate Charges:</strong> If you are charged multiple times for the same subscription period, we will refund the duplicate charges
              </li>
              <li>
                <strong>Unauthorized Charges:</strong> If your payment method is charged without authorization, we will investigate and refund if confirmed
              </li>
              <li>
                <strong>Legal Requirements:</strong> Refunds required by applicable consumer protection laws
              </li>
            </ul>

            <h3>2.3 Non-Refundable Items</h3>
            <ul>
              <li>Subscription fees for completed billing periods</li>
              <li>Unused call credits or analysis quotas</li>
              <li>Fees for add-on services or features</li>
              <li>Processing fees charged by payment processors</li>
            </ul>

            <h3>2.4 Refund Processing</h3>
            <ul>
              <li>Refund requests must be submitted within 30 days of the charge</li>
              <li>Refunds will be processed to the original payment method within 5-10 business days</li>
              <li>Refunds may take additional time to appear in your account depending on your financial institution</li>
              <li>We reserve the right to deny refund requests that do not meet our refund criteria</li>
            </ul>
          </section>

          <section>
            <h2>3. Downgrades and Plan Changes</h2>
            
            <h3>3.1 Downgrading Your Plan</h3>
            <ul>
              <li>You may downgrade your subscription at any time</li>
              <li>Downgrades take effect at the end of your current billing period</li>
              <li>You will retain access to your current plan&apos;s features until the period ends</li>
              <li>No refund is provided for the difference in plan costs</li>
            </ul>

            <h3>3.2 Upgrading Your Plan</h3>
            <ul>
              <li>Upgrades take effect immediately</li>
              <li>You will be charged a prorated amount for the upgrade</li>
              <li>Your billing cycle will be adjusted accordingly</li>
            </ul>
          </section>

          <section>
            <h2>4. Data Retention After Cancellation</h2>
            
            <h3>4.1 Free Tier Retention</h3>
            <p>
              If you cancel and are eligible for the Free tier, your data will be retained according to Free tier limits. Analysis history may be limited or removed based on storage constraints.
            </p>

            <h3>4.2 Account Deletion</h3>
            <ul>
              <li>You may request complete account deletion at any time</li>
              <li>Account deletion is permanent and cannot be undone</li>
              <li>All your data, including analysis results, will be permanently deleted</li>
              <li>We may retain certain data as required by law or for legitimate business purposes</li>
            </ul>

            <h3>4.3 Data Export</h3>
            <p>
              Before canceling, you may export your data, including analysis results and reports, through your account settings or by contacting support.
            </p>
          </section>

          <section>
            <h2>5. Billing Disputes</h2>
            <p>
              If you believe you have been charged incorrectly:
            </p>
            <ol>
              <li>Contact us immediately at <a href="mailto:billing@audiolyse.com">billing@audiolyse.com</a></li>
              <li>Provide your account information and details of the disputed charge</li>
              <li>We will investigate and respond within 5 business days</li>
              <li>If the charge is found to be incorrect, we will issue a refund or credit</li>
            </ol>
          </section>

          <section>
            <h2>6. Subscription Renewal</h2>
            <ul>
              <li>Subscriptions automatically renew at the end of each billing period</li>
              <li>You will be charged the then-current subscription fee</li>
              <li>We will send you a renewal notice before charging your payment method</li>
              <li>You can cancel before the renewal date to avoid being charged</li>
              <li>If payment fails, your subscription may be suspended or canceled</li>
            </ul>
          </section>

          <section>
            <h2>7. Special Circumstances</h2>
            
            <h3>7.1 Annual Subscriptions</h3>
            <p>
              Annual subscriptions are non-refundable after 30 days from the initial purchase. Within the first 30 days, you may request a prorated refund for the remaining months.
            </p>

            <h3>7.2 Enterprise Plans</h3>
            <p>
              Enterprise plan cancellations and refunds are governed by the specific terms in your Enterprise Agreement.
            </p>

            <h3>7.3 Promotional Offers</h3>
            <p>
              Special promotional pricing or free trial periods are subject to the specific terms of the promotion. Cancellation during a free trial will not result in any charges.
            </p>
          </section>

          <section>
            <h2>8. Contact for Cancellation and Refunds</h2>
            <p>
              For questions, cancellation requests, or refund inquiries, please contact us:
            </p>
            <ul>
              <li><strong>Email:</strong> <a href="mailto:support@audiolyse.com">support@audiolyse.com</a></li>
              <li><strong>Billing Inquiries:</strong> <a href="mailto:billing@audiolyse.com">billing@audiolyse.com</a></li>
              <li><strong>Website:</strong> <Link href="/contact">Contact Us</Link></li>
              <li><strong>Response Time:</strong> We aim to respond within 24-48 hours</li>
            </ul>
          </section>

          <section>
            <h2>9. Changes to This Policy</h2>
            <p>
              We reserve the right to modify this Cancellation & Refunds Policy at any time. Material changes will be communicated to active subscribers via email. Your continued use of the Service after changes become effective constitutes acceptance of the updated policy.
            </p>
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

