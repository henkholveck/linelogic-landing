"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from 'next/navigation'
import { ArrowLeft, Shield, Activity, Eye } from "lucide-react"

export default function FAQPage() {
  const router = useRouter()

  const faqs = [
    {
      question: "How do you test queue placement without logging in?",
      answer: "We use embedded traffic mirrors and packet traces linked to account identifiers. Our diagnostic pipeline connects directly to allocation system load balancers, analyzing pre-queue signal patterns before accounts enter the waiting room. No credentials are required because we're already watching what matters."
    },
    {
      question: "Is this legal?",
      answer: "We offer queue diagnostics and signal enhancement services. We do not alter account data, impersonate platform behavior, or access private user information. Our diagnostics operate on publicly available traffic patterns and placement indicators that are already being transmitted during normal queue operations."
    },
    {
      question: "Why do some accounts show better placement than others?",
      answer: "Some accounts generate more stable pre-queue signals based on their traffic patterns, browser fingerprints, and connection consistency. Others are flagged by automated systems for various reasons - proxy usage, bot-like behavior, or previous violations. Our job is to tell you the truth about your account's standing before the drop happens."
    },
    {
      question: "Will this guarantee a better queue spot?",
      answer: "No service can guarantee specific queue positions. However, our priority injection modifies the traffic signals that allocation systems use for placement decisions. Ignoring signal weaknesses guarantees you'll stay behind accounts with stronger patterns. Use the tools available, or watch someone else get your seats."
    },
    {
      question: "How does priority injection work?",
      answer: "Priority injection works by modifying the pre-queue traffic signals associated with your account identifier. When you enter a queue, the allocation system reads these signals to determine placement. Our injection service pushes optimized patterns that typically result in significantly improved positioning."
    },
    {
      question: "Where does your data come from?",
      answer: "Our diagnostics come from the same pipeline used by allocation partners. We're plugged into traffic mirrors that monitor placement engine behavior in real-time. This gives us visibility into the signals that matter before queues even form."
    },
    {
      question: "Why should I trust these results?",
      answer: "Don't trust them - verify them. Run diagnostics on accounts you know are clean versus ones you suspect are flagged. The patterns will speak for themselves. We're not here to sell you hope - we're here to show you reality."
    },
    {
      question: "Can the platform detect injection?",
      answer: "Our injection methods operate at the traffic signal level, not at the application level. We modify patterns that allocation systems expect to see, making detection extremely difficult. However, overuse or obvious abuse patterns may trigger automated reviews."
    },
    {
      question: "How quickly does injection work?",
      answer: "Signal modifications are pushed immediately upon payment verification. However, the full effect becomes apparent when you enter the next queue session. Some users report improved placement within minutes, others see results in the following drop."
    },
    {
      question: "What if injection doesn't work?",
      answer: "Injection success depends on multiple factors including account history, current system load, and traffic patterns. While we maintain a high success rate, no technical solution is 100% effective. We recommend using injection strategically on high-value drops."
    },
    {
      question: "Is my account information secure?",
      answer: "We never store login credentials or personal information. Our diagnostics operate purely on traffic pattern analysis using account identifiers (email addresses). All data is encrypted and purged after diagnostic completion."
    },
    {
      question: "How often can I use injection?",
      answer: "Use sparingly. Frequent injection on the same account may create detectable patterns. We recommend injection for high-priority drops only. Abuse may trigger shadow lockouts or reduced effectiveness."
    },
    {
      question: "Why is this service expensive?",
      answer: "Maintaining access to allocation system diagnostics requires significant technical infrastructure and carries operational risks. Our pricing reflects the value of the intelligence we provide and the limited nature of our access."
    },
    {
      question: "Can you inject multiple accounts at once?",
      answer: "Yes, we offer bulk injection services for multiple accounts. However, injecting numerous accounts simultaneously for the same drop may trigger automated detection systems. We recommend staggered injection timing."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept cryptocurrency (Bitcoin, Ethereum), PayPal, Cash App, Venmo, and Zelle. All payments are processed manually for security. Injection begins immediately upon payment verification."
    }
  ]

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Button variant="ghost" onClick={() => router.back()} className="mr-4 text-slate-300">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-green-400">LineLogic FAQ</h1>
              <p className="text-slate-400">Technical documentation and system information</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* System Status */}
        <Card className="mb-8 bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-green-400" />
                <span className="text-sm text-green-400">PIPELINE ACTIVE</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-blue-400" />
                <span className="text-sm text-blue-400">ENCRYPTED ACCESS</span>
              </div>
              <div className="flex items-center space-x-2">
                <Eye className="h-5 w-5 text-orange-400" />
                <span className="text-sm text-orange-400">PARTNER VERIFIED</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FAQ Items */}
        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <Card key={index} className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-lg">{faq.question}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300 leading-relaxed">{faq.answer}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Warning Notice */}
        <Card className="mt-8 bg-red-900/20 border-red-600">
          <CardHeader>
            <CardTitle className="text-red-400">Important Notice</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-red-300 space-y-2">
              <p>
                This system provides diagnostic access to allocation infrastructure. Use responsibly and sparingly.
              </p>
              <p>
                Abuse of diagnostic capabilities or injection services may result in:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Account shadow bans or placement penalties</li>
                <li>Detection by automated monitoring systems</li>
                <li>Loss of injection effectiveness</li>
                <li>Termination of diagnostic access</li>
              </ul>
              <p className="font-semibold">
                We are not responsible for any consequences of misuse. Use at your own risk.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="mt-8 bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Support & Contact</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-slate-300 space-y-2">
              <p>For technical support or urgent issues:</p>
              <div className="bg-slate-700 p-4 rounded-lg font-mono text-sm">
                <div>Technical Lead: henkster91@gmail.com</div>
                <div>System Admin: monksb92@gmail.com</div>
              </div>
              <p className="text-sm text-slate-400">
                Response time: 2-6 hours during business hours. Emergency issues may take longer.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
