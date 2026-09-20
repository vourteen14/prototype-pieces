import Image from "next/image";
import Link from "next/link";

export function Brand() {
  return (
    <Link href="/" className="flex items-center">
      <Image
        src="/logo.png"
        alt="Logo Klinik Pratama Sahaduta"
        width={410}
        height={140}
        className="h-9 w-auto shrink-0 md:h-10"
        priority
      />
    </Link>
  );
}