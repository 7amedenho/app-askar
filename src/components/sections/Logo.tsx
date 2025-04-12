"use client";

import React from "react";
import Image from "next/image";

const Logo = () => {
  return (
    <div className="flex items-center gap-x-4 rtl:gap-x-reverse p-2 sm:p-2 w-full max-w-sm mx-auto">
      {/* صورة اللوجو */}
      <div className="flex-shrink-0">
        <Image
          src="/logo.webp"
          width={70}
          height={70}
          alt="logo"
          className="w-16 sm:w-20 md:w-24"
        />
      </div>

      {/* النصوص */}
      <div className="flex flex-col text-nowrap scale-90">
        <p className="text-xm sm:text-base leading-tight text-zinc-800 dark:text-white">
          Askar Group for <br />
          General Contracting
        </p>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-white">
          عسكر للمقاولات العمومية
        </p>
      </div>
    </div>
  );
};

export default Logo;
