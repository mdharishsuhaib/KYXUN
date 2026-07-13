const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf8');

// 1. Buttons (Create Plan, Grab Pro, Get Started)
code = code.replace(/className="[^"]*bg-gradient-to-r from-indigo-600 to-purple-600[^"]*"([^>]*)>(\s*)Create Plan/g, (match, p1, p2) => {
    return 'className="px-8 py-4 rounded-full font-bold text-[#0a0a0f] text-sm tracking-wide transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 bg-[var(--kyxun-accent)] hover:bg-[var(--kyxun-accent-hover)] shadow-[0_0_20px_rgba(132,204,22,0.4)] hover:shadow-[0_0_30px_rgba(132,204,22,0.6)] flex items-center justify-center gap-2"' + p1 + '>' + p2 + 'Create Plan';
});

code = code.replace(/className="[^"]*bg-gradient-to-r from-indigo-500 to-purple-500[^"]*"([^>]*)>(\s*)Grab Pro/g, (match, p1, p2) => {
    return 'className="w-full py-4 rounded-2xl font-bold text-[#0a0a0f] text-sm tracking-wide transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 shadow-[0_0_15px_rgba(132,204,22,0.4)] hover:shadow-[0_0_25px_rgba(132,204,22,0.6)] flex items-center justify-center gap-2 bg-[var(--kyxun-accent)] hover:bg-[var(--kyxun-accent-hover)]"' + p1 + '>' + p2 + 'Grab Pro';
});

// "Get Started" in header
code = code.replace(/className="[^"]*bg-white dark:bg-white\/10 text-black dark:text-white hover:bg-white\/90[^"]*"([^>]*)>(\s*)Get Started/g, (match, p1, p2) => {
    return 'className="px-6 py-2.5 rounded-full font-bold text-[#0a0a0f] text-sm transition-all duration-300 transform hover:scale-105 bg-[var(--kyxun-accent)] hover:bg-[var(--kyxun-accent-hover)] shadow-[0_0_15px_rgba(132,204,22,0.4)] flex items-center gap-2"' + p1 + '>' + p2 + 'Get Started';
});

// "Login" in header
code = code.replace(/className="[^"]*bg-\[var\(--kyxun-bg-secondary\)\][^"]*"([^>]*)>(\s*)Login/g, (match, p1, p2) => {
    return 'className="px-6 py-2.5 rounded-full font-bold text-[var(--kyxun-text)] text-sm transition-all duration-300 border border-[var(--kyxun-border)] hover:bg-[var(--kyxun-bg-secondary)] flex items-center gap-2"' + p1 + '>' + p2 + 'Login';
});

// Hero text gradient
code = code.replace(/from-indigo-400 to-purple-400/g, 'from-lime-400 to-green-500');

// Kyxun AI Copilot table header
code = code.replace(/className="([^"]*)text-indigo-400([^"]*)"([^>]*)>(\s*)Kyxun AI Copilot/g, (match, p1, p2, p3, p4) => {
    return 'className="' + p1 + 'text-[var(--kyxun-accent)]' + p2 + '"' + p3 + '>' + p4 + 'Kyxun AI Copilot';
});
code = code.replace(/className="([^"]*)text-indigo-600([^"]*)"([^>]*)>(\s*)Kyxun AI Copilot/g, (match, p1, p2, p3, p4) => {
    return 'className="' + p1 + 'text-[var(--kyxun-accent)]' + p2 + '"' + p3 + '>' + p4 + 'Kyxun AI Copilot';
});

// Fix badges in the feature section (Visual Storytelling, Simple Pricing, Most Popular, AI-Powered Exam Copilot)
code = code.replace(/kyxun-badge-indigo/g, 'kyxun-badge-lime');
code = code.replace(/kyxun-badge-purple/g, 'kyxun-badge-lime');

// Footer logo mismatch
code = code.replace(/<div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg mb-6">[\s\S]*?<\/div>/, 
  '<div className="w-9 h-9 drop-shadow-md dark:drop-shadow-[0_0_15px_rgba(163,230,53,0.65)] mb-6">\\n              <img src="/logo_white_icon.png" alt="Kyxun Logo" className="w-full h-full object-contain dark:hidden" />\\n              <img src="/logo_dark_icon.png" alt="Kyxun Logo" className="w-full h-full object-contain hidden dark:block" />\\n            </div>'
);

// Checkmarks in pricing
code = code.replace(/<Check className="w-5 h-5 text-indigo-400" \/>/g, '<Check className="w-5 h-5 text-green-500" />');
code = code.replace(/<Check className="w-5 h-5 text-purple-400" \/>/g, '<Check className="w-5 h-5 text-green-500" />');
code = code.replace(/<Check className="w-4 h-4 text-indigo-500" \/>/g, '<Check className="w-4 h-4 text-green-500" />');

// Links in footer
code = code.replace(/className="text-sm font-semibold text-\[var\(--kyxun-text-muted\)\] hover:text-\[var\(--kyxun-text\)\] transition-colors"/g, 'className="text-sm font-semibold text-[var(--kyxun-text-muted)] hover:text-[var(--kyxun-accent)] hover:underline underline-offset-4 transition-all"');

// Contrast issues
// "Standard AI Chatbots"
code = code.replace(/className="text-lg font-black text-white\/50 font-outfit"/g, 'className="text-lg font-black text-gray-500 dark:text-slate-400 font-outfit"');
code = code.replace(/className="text-lg font-black text-gray-400 font-outfit"/g, 'className="text-lg font-black text-gray-500 dark:text-slate-400 font-outfit"');
// "or  for exam season"
code = code.replace(/text-indigo-200\/50/g, 'text-slate-500 dark:text-slate-400');
code = code.replace(/text-white\/30/g, 'text-slate-500 dark:text-slate-400');
// dark mode footer tagline
code = code.replace(/text-\[var\(--kyxun-text-subtle\)\]/g, 'text-[var(--kyxun-text-subtle)] dark:text-slate-400');


fs.writeFileSync('src/app/page.tsx', code);
console.log('Applied fixes to page.tsx');
