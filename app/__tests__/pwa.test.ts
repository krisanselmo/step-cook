import fs from 'fs';
import path from 'path';
import manifest from '../manifest';
import { metadata } from '../layout';

// layout.tsx charge next/font/google au niveau module : on le neutralise.
jest.mock('next/font/google', () => {
  const font = () => ({ variable: '--mock', className: 'mock', style: {} });

  return {
    Geist: font,
    Geist_Mono: font,
    VT323: font,
    Cinzel: font,
    Lora: font,
  };
});

const PUBLIC = path.join(process.cwd(), 'public');

describe('manifest()', () => {
  const m = manifest();

  it('expose les champs requis pour l’installabilité', () => {
    expect(m.name).toBeTruthy();
    expect(m.short_name).toBeTruthy();
    expect(m.start_url).toBe('/');
    expect(m.display).toBe('standalone');
    expect(m.theme_color).toBeTruthy();
    expect(m.background_color).toBeTruthy();
    // Chrome refuse l’installation si ce drapeau est vrai.
    expect(m.prefer_related_applications).toBeFalsy();
  });

  it('déclare les icônes PNG 192 et 512 exigées par Chrome pour l’install', () => {
    const png = (m.icons ?? []).filter(i => i.type === 'image/png');

    expect(png.map(i => i.sizes)).toEqual(
      expect.arrayContaining(['192x192', '512x512']),
    );
  });

  it('ne référence que des fichiers d’icônes présents dans public/', () => {
    for (const icon of m.icons ?? []) {
      const file = path.join(PUBLIC, icon.src.replace(/^\//, ''));

      expect(fs.existsSync(file)).toBe(true);
    }
  });
});

describe.each([
  ['icon-192x192.png', 192],
  ['icon-512x512.png', 512],
])('asset %s', (file, size) => {
  it(`est un PNG valide de ${size}×${size}`, () => {
    const buf = fs.readFileSync(path.join(PUBLIC, file));

    // Signature PNG.
    expect(buf.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
    // Dimensions réelles (IHDR) — doivent matcher le `sizes` du manifest,
    // sinon Chrome rejette l’icône et n’offre pas l’installation.
    expect(buf.readUInt32BE(16)).toBe(size);
    expect(buf.readUInt32BE(20)).toBe(size);
  });
});

describe('service worker (public/sw.js)', () => {
  const sw = fs.readFileSync(path.join(PUBLIC, 'sw.js'), 'utf8');

  it('enregistre les listeners install, activate et fetch', () => {
    expect(sw).toMatch(/addEventListener\(\s*['"]install['"]/);
    expect(sw).toMatch(/addEventListener\(\s*['"]activate['"]/);
    expect(sw).toMatch(/addEventListener\(\s*['"]fetch['"]/);
  });
});

describe('métadonnées PWA du document (layout)', () => {
  it('lie le manifest', () => {
    expect(metadata.manifest).toBe('/manifest.webmanifest');
  });

  it('utilise une apple-touch-icon PNG (le SVG n’est pas rendu en icône d’accueil)', () => {
    const apple = (metadata.icons as { apple: string }).apple;

    expect(apple).toMatch(/\.png$/);
  });
});
