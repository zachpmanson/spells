import type { ReactNode } from 'react'
import { Outlet, createRootRoute, HeadContent, Scripts } from '@tanstack/react-router'
import '../App.css'
import '../styles/tailwind.css'
import { UserBadge } from '../components/UserBadge'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Spells' },
    ],
    links: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
  }),
  component: RootComponent,
})

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  )
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html>
      <head>
        {/*
          Edge logout navigates to a Basic-auth URL embedding the reserved
          `guest` credential so the browser signs out silently (see UserBadge
          edgeLogout). That leaves credentials in the URL, and the browser
          refuses to construct a relative fetch against a base URI carrying
          userinfo ("URL with embedded credentials" TypeError breaks every data
          request after logout). Turn any userinfo-bearing page into a clean /
          navigation the instant it parses — before any hydration fetch — so
          the base URI is clean again. The browser keeps re-sending the cached
          guest Basic credential, so the reload stays signed out. Key the check
          on document.baseURI, not location.href (the browser cleans that).
          indexOf form deliberately, not a regex: /-escapes double-escape
          through dangerouslySetInnerHTML templates.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var u=document.baseURI||"";var a=u.indexOf("@");if(a<0)return;var at=u.indexOf("//");if(a<=at)return;var sl=u.indexOf("/",at+2);if(sl>=0&&sl<a)return;window.location.replace(window.location.protocol+"//"+window.location.host+"/");}catch(e){}})();`,
          }}
        />
        <HeadContent />
      </head>
      <body>
        <UserBadge />
        {children}
        <Scripts />
      </body>
    </html>
  )
}
