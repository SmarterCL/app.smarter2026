"use client";
import React from "react";
import { CheckCircle2, Clock } from "lucide-react";

interface ServiceCardProps {
  name: string;
  enabled?: boolean;
  link?: string;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ name, enabled, link }) => {
  return (
    <div className="rounded border p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm">{name}</span>
        {enabled ? (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        ) : (
          <Clock className="h-4 w-4 text-yellow-500" />
        )}
      </div>
      <div className="text-xs text-muted-foreground">
        Estado: {enabled ? "connected" : "pending"}
      </div>
      {link ? (
        <a
          href={link}
          target="_blank"
          rel="noreferrer"
          className="text-xs underline text-primary"
        >
          Abrir {name}
        </a>
      ) : null}
    </div>
  );
};

export default ServiceCard;