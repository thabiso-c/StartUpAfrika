import React from "react";
import { Mail, Globe, Users, Target, BookOpen, Zap, Heart, ArrowRight } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-emerald-50 via-white to-blue-50 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-20">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
              About Startup Afrika
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed mb-8">
              We chronicle the real blueprints of African tech innovation — the unfiltered stories, 
              engineering decisions, and hard-earned lessons from the founders building the continent's future.
            </p>
            <div className="flex items-center justify-center">
              <a
                href="mailto:info@startupafrika.co.za"
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-800 text-white font-bold rounded-xl hover:bg-emerald-900 transition-colors"
              >
                <Mail className="w-5 h-5" />
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-4">
              <Target className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Our Mission</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              To document and share the authentic stories of African tech founders, 
              providing a platform where engineering choices, payment integrations, 
              and growth strategies are openly discussed.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Our Community</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              A growing network of African founders, developers, investors, and tech 
              enthusiasts who believe in the power of shared knowledge and peer-to-peer learning.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-4">
              <BookOpen className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Our Content</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              In-depth interviews, technical breakdowns, and actionable insights 
              that go beyond the hype to explore what actually works in African markets.
            </p>
          </div>
        </div>
      </div>

      {/* Story Section */}
      <div className="bg-gray-50 border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">The Story Behind Startup Afrika</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                Startup Afrika was born from a simple observation: while African tech innovation was exploding 
                across the continent, the authentic, unfiltered blueprints of how these startups were actually 
                built remained largely undocumented.
              </p>
              <p>
                Founded by Thabiso Letsoko, a developer and entrepreneur based in Johannesburg, South Africa, 
                Startup Afrika began as a personal project to fill this gap. What started as a series of 
                email interviews with local founders quickly grew into a comprehensive media platform.
              </p>
              <p>
                Today, we feature structured Q&As, code breakdowns, payment gateway insights, and growth 
                strategies from founders across Africa. From Paystack and Ozow integrations to scalable 
                cloud architectures, we explore the unique challenges and solutions that come with building 
                technology on the continent.
              </p>
              <p>
                Our name reflects our core belief: Africa is not just a market — it's a startup ecosystem 
                with its own patterns, resilience, and innovation. We're here to document that story, 
                one founder at a time.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">What We Stand For</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex gap-4">
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-1">Authenticity Over Hype</h4>
              <p className="text-sm text-gray-600">
                We publish real stories, real numbers, and real lessons. No fluff, no exaggeration — 
                just the honest truth about building in Africa.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
              <Heart className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-1">Community First</h4>
              <p className="text-sm text-gray-600">
                Every story we publish is a gift to the community. We believe in open knowledge 
                sharing and lifting up the next generation of builders.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-1">Technical Depth</h4>
              <p className="text-sm text-gray-600">
                We dive deep into the technical details — payment integrations, cloud architecture, 
                database choices — because that's where the real learning happens.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center shrink-0">
              <Globe className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-1">Pan-African Perspective</h4>
              <p className="text-sm text-gray-600">
                We cover founders from Lagos to Nairobi, Cape Town to Cairo. Africa's tech ecosystem 
                is diverse, and we celebrate that diversity.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-emerald-800 to-emerald-900 text-white">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Have a Story to Share?</h2>
            <p className="text-emerald-100 mb-8">
              We're always looking for founders, developers, and builders with compelling stories. 
              Whether you've just launched your MVP or scaled to thousands of users, we want to hear from you.
            </p>
            <div className="flex items-center justify-center">
              <a
                href="mailto:info@startupafrika.co.za"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-emerald-900 font-bold rounded-xl hover:bg-gray-100 transition-colors"
              >
                <Mail className="w-5 h-5" />
                Get in Touch
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
            <Mail className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Contact Us</h3>
            <p className="text-gray-600 mb-6">
              Have questions, partnership inquiries, or just want to say hello? 
              We'd love to hear from you.
            </p>
            <a
              href="mailto:info@startupafrika.co.za"
              className="inline-flex items-center gap-2 text-lg font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
            >
              <Mail className="w-5 h-5" />
              info@startupafrika.co.za
            </a>
            <div className="mt-6 pt-6 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                We typically respond within 24-48 hours. For urgent matters, please include "URGENT" in your subject line.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}