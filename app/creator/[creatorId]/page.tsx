import React from 'react';

export default function CreatorPage({ params }: { params: { creatorId: string } }) {
  return (
    <div>
      <h1>Creator ID: {params.creatorId}</h1>
    </div>
  );
}
