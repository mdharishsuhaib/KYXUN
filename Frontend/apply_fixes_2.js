const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf8');

// 1. "Graduate Strong." text
code = code.replace(
  '<span className="whitespace-nowrap inline-block pb-4 pt-2 pr-4 leading-tight" style={{ background: "linear-gradient(135deg, #a855f7, #6366f1, #06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>\r\n              Graduate Strong.\r\n            </span>',
  '<span className="whitespace-nowrap inline-block pb-4 pt-2 pr-4 leading-tight text-[var(--kyxun-accent)]">\r\n              Graduate Strong.\r\n            </span>'
);

code = code.replace(
  '<span className="whitespace-nowrap inline-block pb-4 pt-2 pr-4 leading-tight" style={{ background: "linear-gradient(135deg, #a855f7, #6366f1, #06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>\n              Graduate Strong.\n            </span>',
  '<span className="whitespace-nowrap inline-block pb-4 pt-2 pr-4 leading-tight text-[var(--kyxun-accent)]">\n              Graduate Strong.\n            </span>'
);

// 2. Remove button light effects & make them solid lime-green
code = code.replace(
  'className="px-9 py-5 rounded-2xl font-black text-xl kyxun-text text-center transition-all hover:scale-[1.03] active:scale-[0.97] shadow-[0_0_45px_rgba(132,204,22,0.5)]"\r\n              style={{ background: "linear-gradient(135deg, var(--kyxun-accent), var(--kyxun-accent-secondary))" }}',
  'className="px-9 py-5 rounded-2xl font-black text-xl kyxun-text text-center transition-all hover:scale-[1.03] active:scale-[0.97] bg-[var(--kyxun-accent)]"'
);
code = code.replace(
  'className="px-9 py-5 rounded-2xl font-black text-xl kyxun-text text-center transition-all hover:scale-[1.03] active:scale-[0.97] shadow-[0_0_45px_rgba(132,204,22,0.5)]"\n              style={{ background: "linear-gradient(135deg, var(--kyxun-accent), var(--kyxun-accent-secondary))" }}',
  'className="px-9 py-5 rounded-2xl font-black text-xl kyxun-text text-center transition-all hover:scale-[1.03] active:scale-[0.97] bg-[var(--kyxun-accent)]"'
);

code = code.replace(
  'className="w-full py-4 rounded-2xl font-black text-base kyxun-text text-center transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_30px_rgba(132,204,22,0.3)]"\r\n              style={{ background: "linear-gradient(135deg, var(--kyxun-accent), var(--kyxun-accent-secondary))" }}',
  'className="w-full py-4 rounded-2xl font-black text-base kyxun-text text-center transition-all hover:scale-[1.02] active:scale-[0.98] bg-[var(--kyxun-accent)]"'
);
code = code.replace(
  'className="w-full py-4 rounded-2xl font-black text-base kyxun-text text-center transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_30px_rgba(132,204,22,0.3)]"\n              style={{ background: "linear-gradient(135deg, var(--kyxun-accent), var(--kyxun-accent-secondary))" }}',
  'className="w-full py-4 rounded-2xl font-black text-base kyxun-text text-center transition-all hover:scale-[1.02] active:scale-[0.98] bg-[var(--kyxun-accent)]"'
);

// Update 'Get Started' to be lime-green
code = code.replace(
  'className="hidden sm:flex px-4 py-2 rounded-lg text-sm font-medium text-[var(--kyxun-text)] transition-colors border border-[var(--kyxun-border)] hover:bg-[var(--kyxun-hover-bg)]"\r\n            >\r\n              Get Started',
  'className="hidden sm:flex px-4 py-2 rounded-lg text-sm font-medium kyxun-text bg-[var(--kyxun-accent)] transition-transform hover:scale-105"\r\n            >\r\n              Get Started'
);
code = code.replace(
  'className="hidden sm:flex px-4 py-2 rounded-lg text-sm font-medium text-[var(--kyxun-text)] transition-colors border border-[var(--kyxun-border)] hover:bg-[var(--kyxun-hover-bg)]"\n            >\n              Get Started',
  'className="hidden sm:flex px-4 py-2 rounded-lg text-sm font-medium kyxun-text bg-[var(--kyxun-accent)] transition-transform hover:scale-105"\n            >\n              Get Started'
);

code = code.replace(
  'className="w-full py-4 rounded-2xl font-black text-base text-center text-[var(--kyxun-text)] border border-[var(--kyxun-border)] bg-[var(--kyxun-surface)] hover:bg-[var(--kyxun-hover-bg)] transition-all"\r\n            >\r\n              Get Started',
  'className="w-full py-4 rounded-2xl font-black text-base kyxun-text text-center bg-[var(--kyxun-accent)] transition-transform hover:scale-[1.02] active:scale-[0.98]"\r\n            >\r\n              Get Started'
);
code = code.replace(
  'className="w-full py-4 rounded-2xl font-black text-base text-center text-[var(--kyxun-text)] border border-[var(--kyxun-border)] bg-[var(--kyxun-surface)] hover:bg-[var(--kyxun-hover-bg)] transition-all"\n            >\n              Get Started',
  'className="w-full py-4 rounded-2xl font-black text-base kyxun-text text-center bg-[var(--kyxun-accent)] transition-transform hover:scale-[1.02] active:scale-[0.98]"\n            >\n              Get Started'
);

// 3. Remove corner color shades from Step 1,2,3,4
code = code.replace('<div className="absolute top-0 right-0 w-32 h-32 kyxun-badge-lime rounded-full blur-2xl group-hover:kyxun-badge-lime transition-all" />\r\n', '');
code = code.replace('<div className="absolute top-0 right-0 w-32 h-32 kyxun-badge-lime rounded-full blur-2xl group-hover:kyxun-badge-lime transition-all" />\n', '');

code = code.replace('<div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-2xl group-hover:bg-pink-500/15 transition-all" />\r\n', '');
code = code.replace('<div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-2xl group-hover:bg-pink-500/15 transition-all" />\n', '');

code = code.replace('<div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/15 transition-all" />\r\n', '');
code = code.replace('<div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/15 transition-all" />\n', '');


fs.writeFileSync('src/app/page.tsx', code);
console.log('Fixed styling via apply_fixes_2.js');
