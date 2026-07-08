import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center font-sans">
      <Link href="https://jichul.seoeungi.com" className="text-4xl">
        주소이동 ( https://jichul.seoeungi.com )
      </Link>
    </div>
  );
}
