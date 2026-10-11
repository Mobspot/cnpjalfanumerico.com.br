import json
import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"
DOMAIN = "https://cnpjalfanumerico.com.br/"


class SiteTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.index = (ROOT / "index.html").read_text(encoding="utf-8")
        cls.script = (ROOT / "script.js").read_text(encoding="utf-8")
        cls.robots = (ROOT / "robots.txt").read_text(encoding="utf-8")

    def test_metadata_is_consistent(self):
        self.assertIn(f'<link rel="canonical" href="{DOMAIN}">', self.index)
        self.assertIn(f'<meta property="og:url" content="{DOMAIN}">', self.index)
        schema = re.search(r'<script type="application/ld\+json">(.*?)</script>', self.index, re.S)
        self.assertIsNotNone(schema)
        self.assertEqual(json.loads(schema.group(1))["url"], DOMAIN)
        self.assertNotIn("seudominio", self.index)
        self.assertNotIn('name="keywords"', self.index)

    def test_public_artifact_is_allowlisted(self):
        expected = {"index.html", "404.html", "style.css", "script.js", "gerador.png", "robots.txt", "sitemap.xml", "llms.txt", "CNAME"}
        actual = {p.relative_to(DIST).as_posix() for p in DIST.rglob("*") if p.is_file()}
        self.assertEqual(actual, expected)
        self.assertFalse((DIST / "planos.html").exists())
        self.assertFalse((DIST / "obrigado.html").exists())

    def test_no_unapproved_collection_or_measurement(self):
        public_text = "\n".join(p.read_text(encoding="utf-8", errors="ignore") for p in DIST.rglob("*") if p.is_file() and p.suffix != ".png")
        for forbidden in ("formspree", "googletagmanager", "GTM-", "G-MRLT4BW05L", "sk_test_", "Pagamento Confirmado", "Comprar com PIX"):
            self.assertNotIn(forbidden, public_text)

    def test_accessibility_and_links(self):
        self.assertEqual(len(re.findall(r"<h1(?:\s|>)", self.index)), 1)
        self.assertIn('class="skip-link"', self.index)
        self.assertIn('aria-live="polite"', self.index)
        external_blank = re.findall(r'<a\b[^>]*target="_blank"[^>]*>', self.index)
        self.assertTrue(external_blank)
        for anchor in external_blank:
            self.assertRegex(anchor, r'rel="[^"]*noopener[^"]*"')

    def test_discovery_files(self):
        self.assertIn(f"Sitemap: {DOMAIN}sitemap.xml", self.robots)
        self.assertIn("User-agent: OAI-SearchBot\nAllow: /", self.robots)
        self.assertIn("User-agent: GPTBot\nDisallow: /", self.robots)
        self.assertIn(f"<loc>{DOMAIN}</loc>", (ROOT / "sitemap.xml").read_text(encoding="utf-8"))
        self.assertIn("Não há vínculo com a Receita Federal", (ROOT / "llms.txt").read_text(encoding="utf-8"))

    def test_no_obvious_secret(self):
        for path in ROOT.rglob("*"):
            if not path.is_file() or ".git" in path.parts or path.suffix == ".png":
                continue
            text = path.read_text(encoding="utf-8", errors="ignore")
            self.assertNotRegex(text, r"(?i)(api[_-]?key|secret|token)\s*[:=]\s*['\"][A-Za-z0-9_-]{12,}")

    def test_legacy_production_domain_is_not_in_artifact(self):
        public_text = "\n".join(p.read_text(encoding="utf-8", errors="ignore") for p in DIST.rglob("*") if p.is_file() and p.suffix != ".png")
        self.assertNotIn("geradorcnpjalfanumerico.com.br", public_text)


if __name__ == "__main__":
    unittest.main()
