// Tests des regles de validation : `npm test` (node --test, sans dependance).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  Refus, pseudoValide, telephoneValide, finDeNumero, motDePasseValide,
  identifiant, sonValide, avatarValide, dateFacultative, limiteDemandee,
  texteRequis, texteFacultatif,
} from './regles.js'

const refuse = (fn, code = 400) =>
  assert.throws(fn, (e) => e instanceof Refus && e.code === code)

test('pseudo : ramene en minuscules, refuse les caracteres speciaux', () => {
  assert.equal(pseudoValide('Kim_229'), 'kim_229')
  assert.equal(pseudoValide('@asse'), 'asse')
  refuse(() => pseudoValide('ab'))
  refuse(() => pseudoValide('kim admin'))
  refuse(() => pseudoValide('<script>'))
  refuse(() => pseudoValide('a'.repeat(25)))
  refuse(() => pseudoValide(42))
})

test('telephone : toutes les ecritures donnent les memes 8 derniers chiffres', () => {
  const formes = ['+229 01 97 12 34 56', '2290197123456', '0197123456', '97 12 34 56']
  const fins = formes.map((f) => finDeNumero(telephoneValide(f)))
  assert.deepEqual(new Set(fins), new Set(['97123456']))
  refuse(() => telephoneValide('1234'))
  refuse(() => telephoneValide('1'.repeat(16)))
})

test('mot de passe : longueur minimale et plafond bcrypt', () => {
  assert.equal(motDePasseValide('secret1'), 'secret1')
  refuse(() => motDePasseValide('court'))
  refuse(() => motDePasseValide('é'.repeat(40)))
  refuse(() => motDePasseValide(undefined))
})

test('identifiant : seul un uuid passe', () => {
  const id = '6fab17c4-1965-46e3-af9b-e16e4141bf56'
  assert.equal(identifiant(id), id)
  refuse(() => identifiant("1' OR '1'='1"))
  refuse(() => identifiant(undefined))
})

test('son : formats connus uniquement', () => {
  assert.equal(sonValide('dz:3135556'), 'dz:3135556')
  assert.equal(sonValide('video:6fab17c4-1965-46e3-af9b-e16e4141bf56'), 'video:6fab17c4-1965-46e3-af9b-e16e4141bf56')
  assert.equal(sonValide(null), null)
  refuse(() => sonValide('javascript:alert(1)'))
  refuse(() => sonValide('dz:' + '1'.repeat(30)))
})

test('photo de profil : image encodee seulement, jamais une adresse externe', () => {
  assert.equal(avatarValide('data:image/jpeg;base64,AAAA'), 'data:image/jpeg;base64,AAAA')
  assert.equal(avatarValide(''), '')
  assert.equal(avatarValide(undefined), null)
  refuse(() => avatarValide('https://pisteur.example/oeil.gif'))
  refuse(() => avatarValide('data:text/html;base64,PHNjcmlwdD4='))
  refuse(() => avatarValide('data:image/jpeg;base64,' + 'A'.repeat(400_000)))
})

test('textes : vides refuses, longueurs plafonnees', () => {
  assert.equal(texteRequis('  bonjour ', 'texte'), 'bonjour')
  refuse(() => texteRequis('   ', 'texte'))
  refuse(() => texteRequis('x'.repeat(501), 'texte', 500))
  assert.equal(texteFacultatif(12), null)
  refuse(() => texteFacultatif('x'.repeat(161), 'bio', 160))
})

test('pagination : date illisible ignoree, limite plafonnee', () => {
  assert.equal(dateFacultative('pas une date'), null)
  assert.equal(dateFacultative('2026-10-06T21:50:53.552Z'), '2026-10-06T21:50:53.552Z')
  assert.equal(limiteDemandee('100000'), 50)
  assert.equal(limiteDemandee('-3'), 20)
})
