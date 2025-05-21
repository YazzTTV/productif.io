import fs from 'fs'
import path from 'path'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Documentation API Tokens',
  description: 'Documentation pour l\'utilisation des tokens API dans productif.io',
}

export default function ApiTokensDocPage() {
  // Lire le fichier markdown et le convertir en HTML basique
  try {
    const filePath = path.join(process.cwd(), 'docs/api-tokens.md')
    const fileContent = fs.readFileSync(filePath, 'utf8')
    
    // Convertir le markdown en HTML de manière très basique
    // Ceci est une solution temporaire sans dépendances externes
    const htmlContent = convertMarkdownToHTML(fileContent)
    
    return (
      <div className="container mx-auto py-6">
        <div className="prose prose-blue dark:prose-invert max-w-none">
          <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
        </div>
      </div>
    )
  } catch (error) {
    console.error('Erreur lors de la lecture du fichier markdown:', error)
    return notFound()
  }
}

// Fonction basique pour convertir le markdown en HTML
function convertMarkdownToHTML(markdown: string): string {
  // Convertir les titres
  let html = markdown
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    
  // Convertir les paragraphes
  html = html.replace(/^\s*(\n)?(.+)/gm, function (m) {
    return /\<(\/)?(h|ul|ol|li|blockquote|pre|img)/.test(m) ? m : '<p>' + m + '</p>'
  })
  
  // Convertir les listes
  html = html.replace(/^\s*-\s*(.*)/gm, '<li>$1</li>')
  html = html.replace(/<\/li>\n<li>/g, '</li><li>')
  html = html.replace(/<li>(.*)<\/li>/gm, '<ul><li>$1</li></ul>')
  html = html.replace(/<\/ul>\n<ul>/g, '')
  
  // Convertir le code inline
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>')
  
  // Convertir les blocs de code
  html = html.replace(/```([^`]+)```/g, '<pre><code>$1</code></pre>')
  
  // Convertir les séparateurs
  html = html.replace(/\n\n/g, '<br>')
  
  // Convertir le texte en gras
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  
  // Convertir le texte en italique
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>')
  
  return html
} 