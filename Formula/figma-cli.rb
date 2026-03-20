class FigmaCli < Formula
  desc "Control Figma Desktop with Claude Code — design tokens, components, AI prompt export"
  homepage "https://github.com/elvke/figma-cli"
  url "https://registry.npmjs.org/figma-cli/-/figma-cli-1.0.0.tgz"
  sha256 "" # filled in on release
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
