class FigmaCli < Formula
  desc "Control Figma Desktop with Claude Code — design tokens, components, AI prompt export"
  homepage "https://github.com/thepreakerebi/figma-cli"
  url "https://registry.npmjs.org/@jetro/figcli/-/figcli-1.0.0.tgz"
  sha256 "6732bf6e1edd05e9571f47b42306f7d99cc6d44edfd595b61cd8973fdbfec27e"
  license "MIT"

  depends_on "node"

  def install
    system "npm", "install", *Language::Node.std_npm_install_args(libexec)
    bin.install_symlink Dir["#{libexec}/bin/*"]
  end

  test do
    assert_match "1.0.0", shell_output("#{bin}/fig --version")
  end
end
