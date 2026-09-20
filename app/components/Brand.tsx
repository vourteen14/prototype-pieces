import Image from "next/image";
import Link from "next/link";

export function Brand({ showText = true }: { showText?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <Image
        src="/logo.png"
        alt="Logo Klinik Pratama Sahaduta"
        width={410}
        height={140}
        className="h-9 w-auto shrink-0 md:h-10"
        priority
      />
      {showText ? (
        <span className="text-base font-extrabold tracking-tight text-blue-700 md:text-lg">
          Klinik Pratama Sahaduta
        </span>
      ) : null}
    </Link>
  );
}