'use client'

import { HelpCircle, BookOpen, MessageCircle, Github, ExternalLink, Rocket, TrendingUp, Wallet, Activity } from 'lucide-react'

const faqs = [
  {
    question: 'What is MonScreener?',
    answer: 'MonScreener is an enterprise-grade token dashboard for the Monad blockchain. It provides real-time data on tokens from DEXScreener, nad.fun launchpad, and wallet analytics through MonArch.'
  },
  {
    question: 'How do I connect my wallet?',
    answer: 'Click the "Connect Wallet" button in the top right corner. MonScreener supports MetaMask, WalletConnect, and other popular wallets. Make sure you\'re connected to Monad Mainnet (Chain ID: 143).'
  },
  {
    question: 'What is nad.fun?',
    answer: 'Nad.fun is a memecoin launchpad on Monad. Tokens start on a bonding curve and graduate to a DEX once they reach their target. MonScreener shows both graduated and non-graduated tokens.'
  },
  {
    question: 'What does "Bonding Curve Progress" mean?',
    answer: 'The bonding curve progress shows how close a token is to graduating from nad.fun to a DEX. At 100%, the token graduates and gains DEX liquidity.'
  },
  {
    question: 'How often is data refreshed?',
    answer: 'Data is refreshed automatically every 30 seconds. You can also manually refresh by clicking the Refresh button on any page.'
  },
  {
    question: 'What is MonArch?',
    answer: 'MonArch is a wallet analytics tool that lets you analyze any Monad wallet address. View balances, transaction history, and token holdings.'
  }
]

const features = [
  {
    icon: TrendingUp,
    title: 'DEXScreener Integration',
    description: 'Real-time token data from DEXScreener including prices, volume, and market cap.'
  },
  {
    icon: Rocket,
    title: 'Nad.fun Launchpad',
    description: 'Track tokens on the nad.fun bonding curve before they graduate to DEX.'
  },
  {
    icon: Wallet,
    title: 'Wallet Analytics',
    description: 'Analyze any Monad wallet with MonArch - view balances, tokens, and history.'
  },
  {
    icon: Activity,
    title: 'Network Activity',
    description: 'Monitor real-time Monad blockchain activity including blocks and gas prices.'
  }
]

export default function HelpPage() {
  return (
    <div className="max-w-[1000px] mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-gradient-monad">
          <HelpCircle className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Help & Documentation</h1>
          <p className="text-sm text-text-muted">
            Learn how to use MonScreener
          </p>
        </div>
      </div>

      {/* Features */}
      <div className="card-base overflow-hidden">
        <div className="p-4 border-b border-dark-border">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-monad-purple" />
            <h2 className="font-semibold text-white">Features</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
          {features.map((feature) => (
            <div key={feature.title} className="p-4 bg-dark-bg-secondary rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-monad-purple/10">
                  <feature.icon className="h-5 w-5 text-monad-purple" />
                </div>
                <h3 className="font-medium text-white">{feature.title}</h3>
              </div>
              <p className="text-sm text-text-muted">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="card-base overflow-hidden">
        <div className="p-4 border-b border-dark-border">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-monad-purple" />
            <h2 className="font-semibold text-white">Frequently Asked Questions</h2>
          </div>
        </div>
        <div className="divide-y divide-dark-border">
          {faqs.map((faq, index) => (
            <div key={index} className="p-4">
              <h3 className="font-medium text-white mb-2">{faq.question}</h3>
              <p className="text-sm text-text-muted">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Resources */}
      <div className="card-base overflow-hidden">
        <div className="p-4 border-b border-dark-border">
          <div className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5 text-monad-purple" />
            <h2 className="font-semibold text-white">Resources</h2>
          </div>
        </div>
        <div className="p-4 space-y-3">
          <a
            href="https://monad.xyz"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 bg-dark-bg-secondary rounded-lg hover:bg-dark-border transition-colors"
          >
            <span className="text-white">Monad Official Website</span>
            <ExternalLink className="h-4 w-4 text-text-muted" />
          </a>
          <a
            href="https://nad.fun"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 bg-dark-bg-secondary rounded-lg hover:bg-dark-border transition-colors"
          >
            <span className="text-white">Nad.fun Launchpad</span>
            <ExternalLink className="h-4 w-4 text-text-muted" />
          </a>
          <a
            href="https://dexscreener.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 bg-dark-bg-secondary rounded-lg hover:bg-dark-border transition-colors"
          >
            <span className="text-white">DEXScreener</span>
            <ExternalLink className="h-4 w-4 text-text-muted" />
          </a>
          <a
            href="https://monadvision.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 bg-dark-bg-secondary rounded-lg hover:bg-dark-border transition-colors"
          >
            <span className="text-white">MonadVision Block Explorer</span>
            <ExternalLink className="h-4 w-4 text-text-muted" />
          </a>
        </div>
      </div>

      {/* Contact */}
      <div className="card-base p-6 text-center">
        <h3 className="font-medium text-white mb-2">Need more help?</h3>
        <p className="text-sm text-text-muted mb-4">
          Join the Monad community for support and updates
        </p>
        <div className="flex items-center justify-center gap-4">
          <a
            href="https://discord.gg/monad"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
          >
            Join Discord
          </a>
          <a
            href="https://twitter.com/moaborz"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary"
          >
            Follow on X
          </a>
        </div>
      </div>
    </div>
  )
}
