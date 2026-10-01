// Applique api/schema.sql a la base Neon. A relancer sans crainte :
// chaque instruction est en CREATE ... IF NOT EXISTS.
import 'dotenv/config'
import { readFileSync } from 'node:fs'
import { neon } from '@neondatabase/serverless'

const chaine = process.env.DATABASE_URL
if (!chaine) { console.error('DATABASE_URL manquant'); process.exit(1) }

const sql = neon(chaine)
const texte = readFileSync(new URL('./schema.sql', import.meta.url), 'utf8')

// Le pilote ne prend qu'une instruction par appel : on decoupe sur les
// points-virgules en fin de ligne, hors commentaires.
const instructions = texte
  .split(/;\s*$/m)
  .map(x => x.replace(/^\s*--.*$/gm, '').trim())
  .filter(Boolean)

let faites = 0
for (const instruction of instructions) {
  try {
    await sql.query(instruction)
    faites++
  } catch (e) {
    console.error('ECHEC :', instruction.slice(0, 70).replace(/\s+/g, ' '))
    console.error('  ', e.message)
    process.exit(1)
  }
}
console.log(`${faites} instructions appliquees.`)

const tables = await sql`
  SELECT table_name FROM information_schema.tables
  WHERE table_schema = 'public' ORDER BY table_name`
console.log('Tables :', tables.map(t => t.table_name).join(', '))
