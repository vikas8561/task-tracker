const fs = require('fs');
const path = require('path');
const srcDir = path.join(__dirname, '../src');

// 1. Update index.css
let css = fs.readFileSync(path.join(srcDir, 'index.css'), 'utf-8');
const responsiveCSS = `
/* MOBILE BANNERS */
.page-header-banner {
  display: flex; align-items: center; gap: 20px;
  background: #ffffff; padding: 24px 32px; border-radius: 16px;
  border: 1px solid rgba(0,0,0,0.06); box-shadow: 0 2px 10px rgba(0,0,0,0.02);
  margin-bottom: 32px;
}
.header-icon-badge {
  width: 56px; height: 56px; border-radius: 16px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.header-text-container h2 {
  font-size: 1.8rem; font-weight: 800; color: var(--text-primary);
  letter-spacing: -0.5px; margin: 0 0 4px 0;
}
.header-text-container p { font-size: 0.95rem; color: var(--text-secondary); margin: 0; }
.overall-progress-card {
  margin-bottom: var(--space-6); background: rgba(255,255,255,0.95);
  border: 1px solid rgba(0,0,0,0.05); padding: var(--space-6); border-radius: 24px;
}
@media (max-width: 768px) {
  .page-header-banner { padding: 16px; gap: 16px; margin-bottom: 24px; }
  .header-icon-badge { width: 48px; height: 48px; border-radius: 12px; }
  .header-icon-badge svg { width: 24px; height: 24px; }
  .header-icon-badge.emoji-badge { font-size: 24px !important; }
  .header-text-container h2 { font-size: 1.4rem; }
  .header-text-container p { font-size: 0.85rem; }
  .overall-progress-card { padding: var(--space-4); border-radius: 16px; margin-bottom: var(--space-4); }
  .task-card { padding: 16px !important; gap: 12px !important; flex-wrap: wrap; }
  .task-content { min-width: 100%; }
  .stat-grid { grid-template-columns: 1fr !important; gap: var(--space-3); }
}
@media (min-width: 480px) and (max-width: 768px) {
  .stat-grid { grid-template-columns: 1fr 1fr !important; }
}
`;
if (!css.includes('.page-header-banner')) {
  fs.writeFileSync(path.join(srcDir, 'index.css'), css + responsiveCSS);
}

// Helper
function r(file, search, replace) {
  let c = fs.readFileSync(path.join(srcDir, file), 'utf-8');
  fs.writeFileSync(path.join(srcDir, file), c.replace(search, replace));
}

// Dashboard
r('components/Dashboard/Dashboard.jsx', 
  /<div className="page-header slide-down" style=\{\{[\s\S]+?\}\}>[\s\S]+?<\/div>\s*<\/div>\s*<\/div>/,
  '<div className="page-header-banner slide-down"><div className="header-icon-badge emoji-badge" style={{ background: "var(--grad-stat-1)", color: "white", boxShadow: "0 4px 12px rgba(30, 58, 138, 0.2)", fontSize: "28px" }}>👋</div><div className="header-text-container"><h2>Welcome back!</h2><p>Here\'s an overview of your study progress.</p></div></div>'
);
r('components/Dashboard/Dashboard.jsx',
  /<div className="card-3d card-3d-glowing overall-progress slide-up" style=\{\{[\s\S]+?\}\}>/,
  '<div className="card-3d card-3d-glowing overall-progress-card slide-up">'
);

// ProgressView
r('components/Progress/ProgressView.jsx',
  /<div className="page-header slide-down" style=\{\{[\s\S]+?\}\}>[\s\S]+?<\/div>\s*<\/div>\s*<\/div>/,
  '<div className="page-header-banner slide-down"><div className="header-icon-badge" style={{ background: "var(--grad-nav-btn)", color: "white", boxShadow: "0 4px 12px rgba(228, 15, 68, 0.2)" }}><TrendingUp size={28} /></div><div className="header-text-container"><h2>Progress</h2><p>Track your study progress across all subjects and chapters.</p></div></div>'
);
r('components/Progress/ProgressView.jsx',
  /<div\s*className="card-3d overall-progress slide-up"\s*style=\{\{[\s\S]+?\}\}\s*>/,
  '<div className="card-3d overall-progress-card slide-up" style={{ background: "#ffffff", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>'
);

// RevisionView
r('components/Revision/RevisionView.jsx',
  /<div className="page-header slide-down" style=\{\{[\s\S]+?\}\}>[\s\S]+?<\/div>\s*<\/div>\s*<\/div>/,
  '<div className="page-header-banner slide-down"><div className="header-icon-badge" style={{ background: "var(--grad-stat-2)", color: "white", boxShadow: "0 4px 12px rgba(76, 29, 149, 0.2)" }}><BookMarked size={28} /></div><div className="header-text-container"><h2>Revision Tasks</h2><p>Tasks marked for revision. Review and reinforce your knowledge.</p></div></div>'
);

console.log('Mobile layout refactored.');
