const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN;

export function PaymentTestModeBanner() {
  if (!clientToken?.startsWith("pk_test_")) return null;
  return (
    <div className="w-full bg-orange/10 border-b border-orange/30 px-4 py-2 text-center text-sm text-orange">
      Wszystkie płatności w podglądzie są w trybie testowym.{" "}
      <a
        href="https://docs.lovable.dev/features/payments#test-and-live-environments"
        target="_blank"
        rel="noopener noreferrer"
        className="underline font-medium"
      >
        Dowiedz się więcej
      </a>
    </div>
  );
}
