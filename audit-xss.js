#!/usr/bin/env node

/**
 * XSS Audit Script
 * Scans the codebase for potential XSS vulnerabilities
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dangerousPatterns = [
  // Direct HTML insertion
  { pattern: /\.innerHTML\s*=/g, type: 'innerHTML assignment' },
  { pattern: /\.outerHTML\s*=/g, type: 'outerHTML assignment' },
  { pattern: /dangerouslySetInnerHTML/g, type: 'dangerouslySetInnerHTML usage' },
  
  // jQuery HTML methods
  { pattern: /\.html\s*\(/g, type: 'jQuery .html() method' },
  
  // Template literals with actual user input (more specific patterns)
  { pattern: /\$\{[^}]*req\.body[^}]*\}/gi, type: 'template literal with request body' },
  { pattern: /\$\{[^}]*req\.query[^}]*\}/gi, type: 'template literal with query params' },
  { pattern: /\$\{[^}]*req\.params[^}]*\}/gi, type: 'template literal with route params' },
  { pattern: /\$\{[^}]*userInput[^}]*\}/gi, type: 'template literal with userInput' },
  { pattern: /\$\{[^}]*task\.title[^}]*\}/gi, type: 'template literal with task title' },
  { pattern: /\$\{[^}]*task\.name[^}]*\}/gi, type: 'template literal with task name' },
  
  // Direct string concatenation for HTML
  { pattern: /['"`]\s*\+\s*[^'"`]*user[^'"`]*\s*\+\s*['"`]/gi, type: 'string concatenation with user input' },
  { pattern: /['"`]\s*\+\s*[^'"`]*input[^'"`]*\s*\+\s*['"`]/gi, type: 'string concatenation with input' },
  
  // Document.write usage
  { pattern: /document\.write\s*\(/g, type: 'document.write usage' },
  
  // eval usage
  { pattern: /eval\s*\(/g, type: 'eval usage' },
  
  // setTimeout/setInterval with strings
  { pattern: /setTimeout\s*\(\s*['"`][^'"`]*\$\{/g, type: 'setTimeout with template literal' },
  { pattern: /setInterval\s*\(\s*['"`][^'"`]*\$\{/g, type: 'setInterval with template literal' },
];

const safePatterns = [
  // Safe alternatives
  { pattern: /\.textContent\s*=/g, type: 'textContent (safe)' },
  { pattern: /\.text\s*\(/g, type: 'jQuery .text() (safe)' },
  { pattern: /DOMPurify\.sanitize/g, type: 'DOMPurify sanitization (safe)' },
  { pattern: /escapeHtml/g, type: 'escapeHtml function (safe)' },
  { pattern: /sanitizeHtml/g, type: 'sanitizeHtml function (safe)' },
];

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const issues = [];
  
  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    
    // Check for dangerous patterns
    dangerousPatterns.forEach(({ pattern, type }) => {
      if (pattern.test(line)) {
        issues.push({
          file: filePath,
          line: lineNumber,
          type,
          content: line.trim(),
          severity: 'HIGH'
        });
      }
    });
    
    // Check for safe patterns (for verification)
    safePatterns.forEach(({ pattern, type }) => {
      if (pattern.test(line)) {
        issues.push({
          file: filePath,
          line: lineNumber,
          type,
          content: line.trim(),
          severity: 'INFO'
        });
      }
    });
  });
  
  return issues;
}

function scanDirectory(dir) {
  const issues = [];
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules and other build directories
      if (!['node_modules', '.git', 'dist', 'build'].includes(file)) {
        issues.push(...scanDirectory(filePath));
      }
    } else if (file.match(/\.(js|jsx|ts|tsx|html)$/)) {
      try {
        issues.push(...scanFile(filePath));
      } catch (error) {
        console.warn(`Warning: Could not scan ${filePath}: ${error.message}`);
      }
    }
  });
  
  return issues;
}

function main() {
  console.log('🔍 XSS Security Audit\n');
  
  const srcDir = path.join(__dirname, 'src');
  const backendDir = path.join(__dirname, 'backend');
  
  let allIssues = [];
  
  if (fs.existsSync(srcDir)) {
    console.log('Scanning frontend source...');
    allIssues.push(...scanDirectory(srcDir));
  }
  
  if (fs.existsSync(backendDir)) {
    console.log('Scanning backend source...');
    allIssues.push(...scanDirectory(backendDir));
  }
  
  // Group issues by severity
  const highIssues = allIssues.filter(issue => issue.severity === 'HIGH');
  const infoIssues = allIssues.filter(issue => issue.severity === 'INFO');
  
  console.log(`\n📊 Audit Results:`);
  console.log(`   High Risk Issues: ${highIssues.length}`);
  console.log(`   Safe Patterns Found: ${infoIssues.length}`);
  
  if (highIssues.length > 0) {
    console.log('\n🚨 HIGH RISK ISSUES FOUND:');
    highIssues.forEach(issue => {
      console.log(`   ${issue.file}:${issue.line} - ${issue.type}`);
      console.log(`   ${issue.content}`);
      console.log('');
    });
  }
  
  if (infoIssues.length > 0) {
    console.log('\n✅ SAFE PATTERNS FOUND:');
    const grouped = infoIssues.reduce((acc, issue) => {
      acc[issue.type] = (acc[issue.type] || 0) + 1;
      return acc;
    }, {});
    
    Object.entries(grouped).forEach(([type, count]) => {
      console.log(`   ${type}: ${count} occurrences`);
    });
  }
  
  if (highIssues.length === 0) {
    console.log('\n🎉 No high-risk XSS vulnerabilities found!');
  } else {
    console.log('\n⚠️  Please review and fix the high-risk issues above.');
    process.exit(1);
  }
}

// Run the audit
main();