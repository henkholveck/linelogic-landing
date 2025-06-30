"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { ArrowRight, Activity, Shield, Zap, Users, TrendingUp, CheckCircle, Star, Clock, Target, Eye, BarChart3 } from 'lucide-react'

export default function HomePage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [isVisible, setIsVisible] = useState(false)
  const [stats, setStats] = useState({
    tests: 0,
    users: 0,
    improvement: 0
  })

  useEffect(() => {
    if (!isLoading && user) {
      // User is logged in, redirect to main app
      router.push('/queue-testing')
      return
    }
    
    setIsVisible(true)
    
    // Animated counters
    const animateCounter = (target, current, setter, increment) => {
      if (current < target) {
        setTimeout(() => {
          setter(current + increment)
        }, 50)
      }
    }

    animateCounter(47823, stats.tests, (val) => setStats(prev => ({...prev, tests: val})), 423)
    animateCounter(2847, stats.users, (val) => setStats(prev => ({...prev, users: val})), 31)
    animateCounter(89, stats.improvement, (val) => setStats(prev => ({...prev, improvement: val})), 1)
  }, [user, isLoading, router])

  const features = [
    {
      icon: <Activity className="h-6 w-6" />,
      title: "Real-Time Diagnostics",
      description: "Direct pipeline access to allocation system traffic patterns and placement indicators."
    },
    {
      icon: <Target className="h-6 w-6" />,
      title: "Account Analysis",
      description: "Comprehensive testing of queue positioning, latency patterns, and risk assessment."
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Priority Injection",
      description: "Signal modification services for improved placement in high-demand scenarios."
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Secure Processing",
      description: "Encrypted diagnostic protocols with anonymous account identifier analysis."
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: "Performance Tracking",
      description: "Historical analysis and improvement metrics for strategic optimization."
    },
    {
      icon: <Eye className="h-6 w-6" />,
      title: "Insider Intelligence",
      description: "Access to allocation patterns typically reserved for system administrators."
    }
  ]

  const testimonials = [
    {
      name: "Marcus K.",
      role: "Volume Broker",
      content: "Finally found something that actually works. The diagnostics showed issues I never knew existed.",
      rating: 5
    },
    {
      name: "Sarah T.",
      role: "Resale Professional", 
      content: "The injection service paid for itself on the first drop. Wish I'd found this sooner.",
      rating: 5
    },
    {
      name: "David R.",
      role: "Account Manager",
      content: "Stopped guessing and started knowing. The insights are incredibly detailed.",
      rating: 5
    }
  ]

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading LineLogic...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-indigo-600/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-8">
                <Activity className="h-4 w-4 mr-2" />
                Live System • Partner Access • Encrypted
              </div>
              
              <h1 className="text-6xl font-bold text-gray-900 mb-6">
                Queue Analysis
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {" "}Redefined
                </span>
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
                Direct diagnostic access to allocation system traffic patterns. 
                Test account positioning, analyze queue behavior, and optimize placement strategies 
                with tools typically reserved for system administrators.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <button 
                  onClick={() => router.push('/register')}
                  className="group bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                >
                  Start Diagnostic Testing
                  <ArrowRight className="inline-block ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button 
                  onClick={() => router.push('/login')}
                  className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-lg text-lg font-semibold hover:border-blue-500 hover:text-blue-600 transition-all duration-300"
                >
                  Member Access
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white/70 backdrop-blur-sm border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-4xl font-bold text-blue-600">{stats.tests.toLocaleString()}+</div>
              <div className="text-gray-600">Diagnostic Tests Completed</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-indigo-600">{stats.users.toLocaleString()}+</div>
              <div className="text-gray-600">Active System Users</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-green-600">{stats.improvement}%</div>
              <div className="text-gray-600">Average Position Improvement</div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Professional Diagnostic Suite
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive analysis tools built for professionals who need reliable queue intelligence.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="group bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100"
              >
                <div className="text-blue-600 mb-4 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Three-Step Process
            </h2>
            <p className="text-xl text-gray-600">
              From diagnostic to optimization in minutes.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mx-auto mb-6">1</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Account Testing</h3>
              <p className="text-gray-600">Submit email addresses for comprehensive diagnostic analysis of queue positioning and traffic patterns.</p>
            </div>
            <div className="text-center">
              <div className="bg-indigo-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mx-auto mb-6">2</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Results Analysis</h3>
              <p className="text-gray-600">Review detailed diagnostics including position estimates, risk factors, and optimization recommendations.</p>
            </div>
            <div className="text-center">
              <div className="bg-green-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mx-auto mb-6">3</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Priority Injection</h3>
              <p className="text-gray-600">Optional signal modification services for accounts requiring improved placement positioning.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Trusted by Professionals
            </h2>
            <p className="text-xl text-gray-600">
              See what industry professionals say about LineLogic.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-gray-100">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic">"{testimonial.content}"</p>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-gray-600 text-sm">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="bg-gradient-to-r from-slate-50 to-blue-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600">
              Credit-based system. Pay only for what you use.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-gray-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Starter</h3>
              <div className="text-4xl font-bold text-blue-600 mb-4">$25</div>
              <p className="text-gray-600 mb-6">50 diagnostic credits</p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-3" />Account diagnostics</li>
                <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-3" />Basic reporting</li>
                <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-3" />Email support</li>
              </ul>
              <button 
                onClick={() => router.push('/register')}
                className="w-full bg-gray-900 text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
              >
                Get Started
              </button>
            </div>
            
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white p-8 rounded-2xl shadow-2xl transform scale-105 border-2 border-blue-300">
              <div className="inline-block bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-semibold mb-4">
                Most Popular
              </div>
              <h3 className="text-2xl font-bold mb-2">Professional</h3>
              <div className="text-4xl font-bold mb-4">$75</div>
              <p className="text-blue-100 mb-6">200 diagnostic credits</p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-400 mr-3" />Advanced diagnostics</li>
                <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-400 mr-3" />Priority injection access</li>
                <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-400 mr-3" />Historical data</li>
                <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-400 mr-3" />Priority support</li>
              </ul>
              <button 
                onClick={() => router.push('/register')}
                className="w-full bg-white text-blue-600 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Start Free Trial
              </button>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-gray-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Enterprise</h3>
              <div className="text-4xl font-bold text-indigo-600 mb-4">$200</div>
              <p className="text-gray-600 mb-6">1000 diagnostic credits</p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-3" />Unlimited diagnostics</li>
                <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-3" />Bulk injection services</li>
                <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-3" />API access</li>
                <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-3" />Dedicated support</li>
              </ul>
              <button 
                onClick={() => router.push('/register')}
                className="w-full bg-gray-900 text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
              >
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 py-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Start Testing?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of professionals using LineLogic for queue analysis and optimization.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => router.push('/register')}
              className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Create Free Account
            </button>
            <button 
              onClick={() => router.push('/login')}
              className="border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
            >
              Member Login
            </button>
          </div>
        </div>
      </div>

      {/* Simple Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-4">
            <h3 className="text-2xl font-bold">LineLogic</h3>
            <p className="text-gray-400">Professional queue analysis and optimization platform.</p>
          </div>
          <div className="border-t border-gray-800 pt-4 text-gray-400">
            <p>&copy; 2025 LineLogic. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
