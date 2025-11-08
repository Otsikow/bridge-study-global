"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  UNIVERSITY_DIRECTORY_DATA,
  UNIVERSITY_REGIONS,
  UNIVERSITY_COUNTRIES,
} from "@/data/university-directory";
import type { UniversityDirectoryItem } from "@/data/university-directory";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";

type SortKey = keyof UniversityDirectoryItem;

export default function RankingTable() {
  const [universities, setUniversities] = React.useState<
    UniversityDirectoryItem[]
  >([]);
  const [sortKey, setSortKey] = React.useState<SortKey>("ranking");
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">(
    "asc",
  );
  const [regionFilter, setRegionFilter] = React.useState<string>("all");
  const [countryFilter, setCountryFilter] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  React.useEffect(() => {
    let filteredData = [...UNIVERSITY_DIRECTORY_DATA];

    if (regionFilter !== "all") {
      filteredData = filteredData.filter(
        (uni) => uni.region === regionFilter,
      );
    }

    if (countryFilter !== "all") {
      filteredData = filteredData.filter(
        (uni) => uni.country === countryFilter,
      );
    }

    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase();
      filteredData = filteredData.filter((uni) =>
        uni.name.toLowerCase().includes(lowercasedQuery),
      );
    }

    const sortedData = filteredData.sort((a, b) => {
      const aValue = a[sortKey];
      const bValue = b[sortKey];

      if (aValue < bValue) {
        return sortDirection === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortDirection === "asc" ? 1 : -1;
      }
      return 0;
    });

    setUniversities(sortedData);
  }, [regionFilter, countryFilter, searchQuery, sortKey, sortDirection]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const renderSortArrow = (key: SortKey) => {
    if (sortKey === key) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    return null;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <Input
          placeholder="Search by university name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
        <Select value={regionFilter} onValueChange={setRegionFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by region" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Regions</SelectItem>
            {UNIVERSITY_REGIONS.map((region) => (
              <SelectItem key={region} value={region}>
                {region}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={countryFilter} onValueChange={setCountryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by country" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Countries</SelectItem>
            {UNIVERSITY_COUNTRIES.map((country) => (
              <SelectItem key={country} value={country}>
                {country}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort("ranking")}>
                  Rank
                  {renderSortArrow("ranking")}
                </Button>
              </TableHead>
              <TableHead>University</TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort("country")}>
                  Country
                  {renderSortArrow("country")}
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button
                  variant="ghost"
                  onClick={() => handleSort("acceptanceRate")}
                >
                  Acceptance Rate
                  {renderSortArrow("acceptanceRate")}
                </Button>
              </TableHead>
              <TableHead className="text-right">Tuition</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {universities.map((uni) => (
              <TableRow key={uni.id}>
                <TableCell className="font-medium">{uni.ranking}</TableCell>
                <TableCell>
                  <div className="font-medium">{uni.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {uni.city}
                  </div>
                </TableCell>
                <TableCell>{uni.country}</TableCell>
                <TableCell className="text-right">
                  {uni.acceptanceRate}%
                </TableCell>
                <TableCell className="text-right">
                  {uni.tuitionDisplay}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
