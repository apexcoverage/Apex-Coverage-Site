import type { Metadata } from 'next';
import './globals.css';


export const metadata: Metadata = {
title: 'Apex Coverage — Simple, reliable auto insurance',
description: 'Get a fast auto insurance quote tailored to your car and budget. Licensed in VA. Clear options, real support.'
};


export default function RootLayout({ children }: { children: React.ReactNode }) {
return (
<html lang="en">
<body>{children}</body>
</html>
);
}