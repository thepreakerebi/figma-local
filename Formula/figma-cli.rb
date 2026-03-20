class FigmaCli < Formula
  desc "Control Figma Desktop with Claude Code — design tokens, components, AI prompt export"
  homepage "https://github.com/thepreakerebi/figma-cli"
  url "https://registry.npmjs.org/figma-local/-/figma-local-1.0.0.tgz"
  sha256 "db24618c3f608f14aaacfd4d2759496508d7cdffc73c8feab0ef6418f6bf76cc"
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
