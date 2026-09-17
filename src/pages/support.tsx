'use client';

import { User, Mail, Phone, Send, Headset } from 'lucide-react';

export default function SupportPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1a1412] p-4 font-sans">
      <div className="flex w-full max-w-[1000px] h-[700px] rounded-[2rem] overflow-hidden shadow-2xl border border-white/5">

        {/* Left Section - Info */}
        <div className="hidden md:flex flex-col w-1/2 bg-gradient-to-br from-[#3b2113] to-[#1e1008] p-12 relative overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full border border-orange-500/5 -translate-y-1/2 translate-x-1/4"></div>
          <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full border border-orange-500/5 -translate-y-1/2 translate-x-1/4"></div>

          <div className="relative z-10 flex flex-col h-full">
            {/* Logo area */}
            <div className="mb-10 flex flex-col items-start">
              <div className="flex items-center gap-1 font-bold text-2xl tracking-wider">
                <span className="text-[#4ade80]">GREENEABLE</span>
                <span className="text-xs align-top super text-[#4ade80]">&reg;</span>
              </div>
              <div className="text-orange-500 font-bold tracking-widest text-sm pl-16 -mt-1">
                SOLAR
              </div>
            </div>

            <div className="flex items-center gap-4 mb-4 text-[#ea580c]">
              <Headset className="w-10 h-10" />
              <h1 className="text-[2.5rem] leading-tight font-extrabold text-white">
                Contact Support
              </h1>
            </div>

            <p className="text-gray-300 text-sm mb-12 max-w-sm leading-relaxed">
              We're here to help! Fill out the form and our support team will get back to you as soon as possible.
            </p>

            <div className="space-y-6 mt-auto">
              <div>
                <h3 className="text-white font-bold text-sm mb-1">Email Us</h3>
                <p className="text-gray-400 text-sm">support@greeneablesolar.com</p>
              </div>
              <div>
                <h3 className="text-white font-bold text-sm mb-1">Call Us</h3>
                <p className="text-gray-400 text-sm">+91 63575 55657</p>
              </div>
              <div>
                <h3 className="text-white font-bold text-sm mb-1">Office Hours</h3>
                <p className="text-gray-400 text-sm">Monday - Saturday, 9:00 AM - 6:00 PM EST</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section - Form */}
        <div className="flex flex-col w-full md:w-1/2 bg-[#201c1a] p-8 md:p-16 justify-center relative overflow-y-auto">
          <div className="w-full max-w-[380px] mx-auto">
            <h2 className="text-3xl font-extrabold text-white mb-2">Get in Touch</h2>
            <p className="text-gray-400 text-sm mb-8">
              Please provide your details below.
            </p>

            <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
              {/* Name Field */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[11px] font-bold text-gray-300 tracking-wider">
                  <User className="w-3.5 h-3.5 text-[#ea580c]" />
                  FULL NAME
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <User className="h-4 w-4 text-[#ea580c]/70" />
                  </div>
                  <input
                    type="text"
                    className="w-full rounded-xl border py-3 pl-11 pr-4 text-sm text-white placeholder-gray-500 outline-none transition bg-[#2a2522] border-white/5 focus:border-[#ea580c] focus:ring-[#ea580c]/20 focus:ring-2"
                    placeholder="John Doe"
                    required
                  />
                </div>
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[11px] font-bold text-gray-300 tracking-wider">
                  <Mail className="w-3.5 h-3.5 text-[#ea580c]" />
                  EMAIL ADDRESS
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <Mail className="h-4 w-4 text-[#ea580c]/70" />
                  </div>
                  <input
                    type="email"
                    className="w-full rounded-xl border py-3 pl-11 pr-4 text-sm text-white placeholder-gray-500 outline-none transition bg-[#2a2522] border-white/5 focus:border-[#ea580c] focus:ring-[#ea580c]/20 focus:ring-2"
                    placeholder="john@example.com"
                    required
                  />
                </div>
              </div>

              {/* Phone Field */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[11px] font-bold text-gray-300 tracking-wider">
                  <Phone className="w-3.5 h-3.5 text-[#ea580c]" />
                  PHONE NUMBER
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <Phone className="h-4 w-4 text-[#ea580c]/70" />
                  </div>
                  <input
                    type="tel"
                    className="w-full rounded-xl border py-3 pl-11 pr-4 text-sm text-white placeholder-gray-500 outline-none transition bg-[#2a2522] border-white/5 focus:border-[#ea580c] focus:ring-[#ea580c]/20 focus:ring-2"
                    placeholder="+1 (555) 000-0000"
                    required
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="button"
                className="group relative flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#f97316] py-3.5 text-[13px] font-bold tracking-wider text-white shadow-lg transition-all hover:bg-[#ea580c] active:scale-[0.98] mt-8"
              >
                <Send className="w-4 h-4 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
                SEND MESSAGE
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
