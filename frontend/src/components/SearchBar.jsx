import React, { useState } from 'react';

const SearchBar = ({ onSearch }) => {
  const [query, setQuery] = useState('');

  const handleChange = (e) => {
    setQuery(e.target.value);
    onSearch(e.target.value);
  };

  return (
    <input
      type="text"
      placeholder="Search conversations..."
      value={query}
      onChange={handleChange}
      className="search-bar"
    />
  );
};

export default SearchBar;
