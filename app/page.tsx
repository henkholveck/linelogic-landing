"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ArrowRight, CheckCircle } from "lucide-react"

export default function LineLogicLanding() {
  const [email, setEmail] = useState("")

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault()
    // Redirect to queue testing with signup mode
    window.location.href = "/queue-testing?mode=signup"
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-100 py-4">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <div className="text-2xl font-bold text-gray-900">LineLogic</div>
          <div className="flex items-center space-x-4">
            <a href="/queue-testing" className="text-gray-600 hover:text-gray-900 font-medium">
              Queue Testing
            </a>
            <a href="/queue-testing?mode=signup">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">Get Started</Button>
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Move from position <span className="text-gray-400">#45,000</span> to{" "}
            <span className="text-blue-600">#7</span> automatically
          </h1>

          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            The only tool that actually improves your queue positions instead of just tracking them.
          </p>

          {/* Before/After Comparison */}
          <div className="grid md:grid-cols-2 gap-8 mb-12 max-w-2xl mx-auto">
            <Card className="border-2 border-gray-200">
              <CardContent className="p-8 text-center">
                <div className="text-sm font-medium text-gray-500 mb-2">Before</div>
                <div className="text-4xl font-bold text-gray-400 mb-2">#45,247</div>
                <div className="text-sm text-gray-500">Typical position</div>
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-200 bg-blue-50">
              <CardContent className="p-8 text-center">
                <div className="text-sm font-medium text-blue-600 mb-2">After LineLogic</div>
                <div className="text-4xl font-bold text-blue-600 mb-2">#7</div>
                <div className="text-sm text-blue-600">Priority access</div>
              </CardContent>
            </Card>
          </div>

          <a href="/queue-testing?mode=signup">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-4 mb-4">
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </a>

          <p className="text-sm text-gray-500">Setup in 2 minutes</p>
        </div>
      </section>

      {/* Results Section */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Real improvements from real brokers</h2>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {[
              { before: "47,653", after: "4", name: "Mike R." },
              { before: "82,000", after: "501", name: "Cody B." },
              { before: "38,247", after: "instant", name: "David M." },
            ].map((result, i) => (
              <Card key={i} className="text-center">
                <CardContent className="p-6">
                  <div className="text-lg font-semibold text-gray-900 mb-4">{result.name}</div>
                  <div className="flex items-center justify-center space-x-4 mb-4">
                    <div>
                      <div className="text-sm text-gray-500">Before</div>
                      <div className="text-2xl font-bold text-gray-400">#{result.before}</div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-blue-600">After</div>
                      <div className="text-2xl font-bold text-blue-600">
                        {result.after === "instant" ? "instant" : `#${result.after}`}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">15,000+</div>
            <div className="text-gray-600">Average position improvement</div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">How it works</h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Connect your accounts",
                description: "Add your accounts in 30 seconds",
              },
              {
                step: "2",
                title: "We optimize positions",
                description: "Our system finds the best queue spots",
              },
              {
                step: "3",
                title: "Get priority access",
                description: "Jump to the front of every line",
              },
            ].map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {step.step}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Everything you need</h2>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                title: "Multi-account coordination",
                description: "Sync all your accounts for maximum coverage",
              },
              {
                title: "Real-time optimization",
                description: "Positions update automatically every few seconds",
              },
              {
                title: "Priority positioning",
                description: "Get placed in the best possible queue spots",
              },
              {
                title: "Safe and secure",
                description: "Works within platform rules, no account risk",
              },
            ].map((feature, i) => (
              <div key={i} className="flex items-start space-x-4">
                <CheckCircle className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div>
              <div className="text-3xl font-bold text-gray-900 mb-2">2,500+</div>
              <div className="text-gray-600">Active users</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900 mb-2">89%</div>
              <div className="text-gray-600">Success rate</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900 mb-2">2 sec</div>
              <div className="text-gray-600">Response time</div>
            </div>
          </div>

          <div className="bg-gray-50 p-8 rounded-lg">
            <p className="text-lg text-gray-700 italic mb-4">
              "LineLogic moved me from position 82,000 to position 501 in my first week. Game changer."
            </p>
            <div className="font-semibold text-gray-900">Cody B., Elite Access</div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-blue-600">
        <div className="max-w-2xl mx-auto text-center text-white">
          <h2 className="text-4xl font-bold mb-6">Ready to improve your positions?</h2>
          <p className="text-xl mb-8 text-blue-100">Join 2,500+ brokers getting priority access with LineLogic</p>

          <form onSubmit={handleSignup} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto mb-6">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 h-12 bg-white text-gray-900"
              required
            />
            <Button
              type="submit"
              size="lg"
              className="h-12 bg-white text-blue-600 hover:bg-gray-100 font-semibold px-8"
            >
              Get Started
            </Button>
          </form>

          <div className="flex items-center justify-center space-x-6 text-blue-100">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4" />
              <span>Instant access</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4" />
              <span>2-minute setup</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4" />
              <span>Immediate results</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-gray-50 border-t border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="text-xl font-bold text-gray-900 mb-4">LineLogic</div>
              <p className="text-gray-600">Queue position optimization for ticket brokers.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Product</h4>
              <div className="space-y-2 text-gray-600">
                <div>Features</div>
                <div>Pricing</div>
                <div>Get Started</div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Support</h4>
              <div className="space-y-2 text-gray-600">
                <div>Help Center</div>
                <div>Contact</div>
                <div>Status</div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Company</h4>
              <div className="space-y-2 text-gray-600">
                <div>About</div>
                <div>Privacy</div>
                <div>Terms</div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-200 mt-8 pt-8 text-center text-gray-500">
            <p>© 2024 LineLogic. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
