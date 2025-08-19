import '../styles/globals.css';
import '../lib/fontawesome';
import type { AppProps } from 'next/app';
import Head from "next/head";
import { ThemeProvider } from "next-themes";
import { Roboto_Mono } from 'next/font/google'

const robotoMono = Roboto_Mono({
  weight: '400',
  subsets: ['latin']
})

function MyApp({ Component, pageProps }: AppProps) {
    return (
        <ThemeProvider attribute="class">
            <Head>
                <title>rstalk</title>
                <link
                    rel="icon"
                    href="/icon512.png"
                />
                <link
                    href="https://fonts.googleapis.com/css2?family=Roboto+Mono&display=swap"
                    rel="stylesheet">
                </link>
            </Head>
            <div className={robotoMono.className}>
                <Component {...pageProps} />
            </div>
        </ThemeProvider>
    );
}

export default MyApp;