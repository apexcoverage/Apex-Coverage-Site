'use client';
import React, { useState } from 'react';
import { Phone, ShieldCheck, Car, Sparkles, ChevronRight, ArrowRight, CheckCircle2, Clock, CreditCard, Lock, Mail, MapPin, MousePointerClick, Stars, ChevronDown } from 'lucide-react';


export default function ApexCoverageSite() {
const [faqOpen, setFaqOpen] = useState<number | null>(0);
const [consent, setConsent] = useState(false);


function FAQItem({ i, q, a }: { i: number; q: string; a: string }) {
const open = faqOpen === i;
return (
<div className="border-b border-gray-200">
<button onClick={() => setFaqOpen(open ? null : i)} className="w-full flex items-center justify-between py-4 text-left" aria-expanded={open}>
<span className="font-medium text-gray-900">{q}</span>
<ChevronDown className={`h-5 w-5 transition-transform ${open ? 'rotate-180' : ''}`} />
</button>
{open && <p className="pb-4 text-gray-600">{a}</p>}
</div>
);
}


function onSubmitQuote(e: React.FormEvent) {
e.preventDefault();
const form = new FormData(e.target as HTMLFormElement);
if (!consent) {
alert('Please accept the consent notice to proceed.');
return;
}
const payload = Object.fromEntries(form.entries());
console.log('Quote form submitted:', payload);
alert('Thanks! We received your info. A licensed agent will follow up shortly.');
(e.target as HTMLFormElement).reset();
setConsent(false);
}


return (
<div className="min-h-screen bg-white text-gray-900">
{/* Top bar */}
<div className="bg-black text-white text-sm">
<div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
<div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-white"/><span>Licensed in VA • Apex Coverage</span></div>
<a href="tel:+15551234567" className="flex items-center gap-2 hover:opacity-90"><Phone className="h-4 w-4"/><span>(555) 123-4567</span></a>
</div>
</div>


{/* Navigation */}
<header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b">
<nav className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
<div className="flex items-center gap-2">
<div className="h-8 w-8 rounded bg-[#cc0000]" aria-hidden />
<span className="font-semibold tracking-tight">Apex <span className="text-[#cc0000]">Coverage</span></span>
</div>
<ul className="hidden md:flex items-center gap-6 text-sm">
<li><a href="#coverages" className="hover:text-[#cc0000]">Coverages</a></li>
<li><a href="#why" className="hover:text-[#cc0000]">Why Apex</a></li>
<li><a href="#reviews" className="hover:text-[#cc0000]">Reviews</a></li>
<li><a href="#faq" className="hover:text-[#cc0000]">FAQ</a></li>
</ul>
<a href="#quote" className="inline-flex items-center gap-2 bg-[#cc0000] text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-red-700 transition"><MousePointerClick className="h-4 w-4"/> Get a Quote</a>
</nav>
</header>


{/* Hero + Quote Card */}
<section className="relative overflow-hidden">
<div className="absolute inset-0 bg-gradient-to-br from-[#cc0000]/10 via-transparent to-[#cc0000]/10 pointer-events-none"/>
<div className="max-w-7xl mx-auto px-4 py-16 grid md:grid-cols-2 gap-10 items-center">
<div>
<h1 className="text-4xl md:text-5xl font-bold leading-tight">Insurance built for real drivers.<br/><span className="text-[#cc0000]">Protect what you build.</span></h1>
<p className="mt-4 text-gray-600 max-w-prose">Simple, reliable auto coverage — customized for your car, your drive, and your budget. Licensed agents, clear options, fast claims support.</p>
<div className="mt-6 flex flex-wrap gap-3">
<a href="#quote" className="inline-flex items-center gap-2 bg-[#cc0000] text-white px-5 py-3 rounded-md font-semibold hover:bg-red-700 transition">Start my quote <ArrowRight className="h-4 w-4"/></a>
<a href="#why" className="inline-flex items-center gap-2 px-5 py-3 rounded-md border font-semibold hover:bg-gray-50 transition">How it works <ChevronRight className="h-4 w-4"/></a>
</div>
<div className="mt-6 flex items-center gap-6 text-sm text-gray-600">
<span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#cc0000]"/> 24/7 Claims</span>
<span className="flex items-center gap-2"><CreditCard className="h-4 w-4 text-[#cc0000]"/> Flexible billing</span>
<span className="flex items-center gap-2"><Lock className="h-4 w-4 text-[#cc0000]"/> Secure & private</span>
</div>
</div>
}