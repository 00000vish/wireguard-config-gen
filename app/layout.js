import "bootstrap/dist/css/bootstrap.min.css"

export const metadata = {
  title: "WireGuard Config Gen",
  description: "WireGuard config generator.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-bs-theme="dark">
      <body>
        {children}
      </body>
    </html>
  );
}
