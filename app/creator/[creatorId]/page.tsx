import React from 'react';

interface PageProps {
  params: {
    creatorId: string;
  };
}

export default function CreatorPage({ params }: PageProps) {
  return (
    <div>
      <h1>Creator ID: {params.creatorId}</h1>
    </div>
  );
}
