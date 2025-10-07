import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  LineChart,
  FileText,
  Activity,
  Database,
  Filter,
  X,
  MapPin,
  Users,
  Package,
  Calendar,
  Building,
  ChevronUp,
  ChevronDown,
  Bookmark,
} from "lucide-react";
import { qlikService } from "@/lib/qlik";

const navItems = [
  {
    path: "/",
    label: "Dashboard",
    icon: BarChart3,
    description: "Main overview and KPIs",
  },
  {
    path: "/analytics",
    label: "Analytics",
    icon: LineChart,
    description: "Deep dive analysis",
  },
  {
    path: "/reports",
    label: "Reports",
    icon: FileText,
    description: "Detailed reporting",
  },
];

// Key filter fields from the Consumer Sales demo app
const filterFields = [
  {
    id: "Region Name",
    label: "Region",
    icon: MapPin,
    values: ["Northeast", "Southeast", "Central", "West", "Southwest"],
  },
  {
    id: "Channel",
    label: "Sales Channel",
    icon: Building,
    values: [
      "Direct",
      "Distribution",
      "Government",
      "Hospital",
      "Internet",
      "Retail",
    ],
  },
  {
    id: "Product Sub Group Desc",
    label: "Product Group",
    icon: Package,
    values: ["Fresh Vegetables", "Canned Fruit", "Cereal", "Candy", "Dairy"],
  },
  // {
  //   id: "Sales Rep",
  //   label: "Sales Rep",
  //   icon: Users,
  //   values: ["Amalia Craig", "Amanda Ho", "Amelia Fields", "Angolan Carter", "Brenda Gibson"],
  // },
  {
    id: "Year",
    label: "Year",
    icon: Calendar,
    values: ["2019", "2020", "2021", "2022", "2023"],
  },
];

export const Navigation: React.FC = () => {
  const location = useLocation();
  const [connected, setConnected] = useState(qlikService.isConnected());
  const [activeFilters, setActiveFilters] = useState<{
    [key: string]: string[];
  }>({});
  const [expandedFilter, setExpandedFilter] = useState<string | null>(null);
  const [applyingFilter, setApplyingFilter] = useState<string | null>(null);
  const [filtersExpanded, setFiltersExpanded] = useState(true);
  const [bookmarksExpanded, setBookmarksExpanded] = useState(false);
  const [bookmarks, setBookmarks] = useState<
    Array<{ id: string; title: string; description?: string }>
  >([]);
  const [applyingBookmark, setApplyingBookmark] = useState<string | null>(null);

  useEffect(() => {
    const handleConnected = () => setConnected(true);
    const handleDisconnected = () => setConnected(false);

    qlikService.on("connected", handleConnected);
    qlikService.on("disconnected", handleDisconnected);

    return () => {
      qlikService.off("connected", handleConnected);
      qlikService.off("disconnected", handleDisconnected);
    };
  }, []);

  // Sync current selections from Qlik Sense when connected
  useEffect(() => {
    console.log("Navigation: Connection state changed, connected:", connected);
    
    const syncSelections = async () => {
      try {
        const currentSelections = await qlikService.getCurrentSelections();
        setActiveFilters(currentSelections);
      } catch (error) {
        console.error("Failed to sync current selections:", error);
      }
    };

    const loadBookmarks = async () => {
      try {
        console.log("Navigation: Loading bookmarks...");
        const bookmarksList = await qlikService.getBookmarks();
        console.log("Navigation: Bookmarks loaded:", bookmarksList);
        setBookmarks(bookmarksList);
      } catch (error) {
        console.error("Failed to load bookmarks:", error);
        // Set empty array on error
        setBookmarks([]);
      }
    };

    // Always try to load bookmarks, regardless of connection state
    loadBookmarks();
    
    if (connected) {
      syncSelections();
    } else {
      // Clear local filters when disconnected, but keep trying bookmarks
      setActiveFilters({});
    }
  }, [connected]);

  // Also try to load bookmarks on component mount
  useEffect(() => {
    const loadBookmarks = async () => {
      try {
        console.log("Navigation: Initial bookmark load...");
        const bookmarksList = await qlikService.getBookmarks();
        console.log("Navigation: Initial bookmarks loaded:", bookmarksList);
        setBookmarks(bookmarksList);
      } catch (error) {
        console.error("Failed to load bookmarks on mount:", error);
      }
    };

    loadBookmarks();
  }, []);

  const indicatorColor = connected ? "bg-green-500" : "bg-red-500";
  const statusText = connected
    ? "Connected to Qlik Sense"
    : "Disconnected from Qlik Sense";

  const toggleFilter = async (fieldId: string, value: string) => {
    if (!connected) {
      console.warn("Cannot apply filters: not connected to Qlik Sense");
      return;
    }

    setApplyingFilter(`${fieldId}-${value}`);

    try {
      setActiveFilters((prev) => {
        const current = prev[fieldId] || [];
        const isActive = current.includes(value);

        let newValues: string[];
        if (isActive) {
          // Remove filter
          newValues = current.filter((v) => v !== value);
        } else {
          // Add filter
          newValues = [...current, value];
        }

        // Apply selection to Qlik Sense (async)
        if (newValues.length > 0) {
          qlikService.selectValues(fieldId, newValues).catch((error) => {
            console.error("Failed to apply selection:", error);
          });
        } else {
          qlikService.clearSelections([fieldId]).catch((error) => {
            console.error("Failed to clear field selection:", error);
          });
        }

        if (newValues.length === 0) {
          const { [fieldId]: removed, ...rest } = prev;
          return rest;
        }
        return { ...prev, [fieldId]: newValues };
      });
    } finally {
      // Clear loading state after a brief delay
      setTimeout(() => setApplyingFilter(null), 300);
    }
  };

  const clearFieldFilters = async (fieldId: string) => {
    if (connected) {
      try {
        await qlikService.clearSelections([fieldId]);
      } catch (error) {
        console.error("Failed to clear field selections:", error);
      }
    }

    setActiveFilters((prev) => {
      const { [fieldId]: removed, ...rest } = prev;
      return rest;
    });
  };

  const clearAllFilters = async () => {
    if (connected) {
      try {
        await qlikService.clearSelections();
      } catch (error) {
        console.error("Failed to clear all selections:", error);
      }
    }

    setActiveFilters({});
  };

  const totalActiveFilters = Object.values(activeFilters).reduce(
    (sum, values) => sum + values.length,
    0
  );

  const applyBookmark = async (bookmarkId: string) => {
    if (!connected) {
      console.warn("Cannot apply bookmark: not connected to Qlik Sense");
      return;
    }

    setApplyingBookmark(bookmarkId);

    try {
      const success = await qlikService.applyBookmark(bookmarkId);
      if (success) {
        // Refresh current selections after applying bookmark
        setTimeout(async () => {
          try {
            const currentSelections = await qlikService.getCurrentSelections();
            setActiveFilters(currentSelections);
          } catch (error) {
            console.error("Failed to sync selections after bookmark:", error);
          }
        }, 500);
      }
    } catch (error) {
      console.error("Failed to apply bookmark:", error);
    } finally {
      setTimeout(() => setApplyingBookmark(null), 300);
    }
  };

  return (
    <Card className="p-6 shadow-card bg-gradient-subtle">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-analytics rounded-lg flex items-center justify-center">
          <Database className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-analytics-slate">Qlik Sense</h2>
          <p className="text-sm text-muted-foreground">Analytics Mashup</p>
        </div>
      </div>

      <nav className="space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link key={item.path} to={item.path}>
              <Button
                variant={isActive ? "default" : "ghost"}
                className={`w-full justify-start gap-3 h-auto p-4 transition-spring ${
                  isActive
                    ? "bg-gradient-analytics shadow-analytics text-white"
                    : "hover:bg-accent/50 hover:shadow-card"
                }`}
              >
                <Icon className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">{item.label}</div>
                  <div
                    className={`text-xs ${
                      isActive ? "text-white/80" : "text-muted-foreground"
                    }`}
                  >
                    {item.description}
                  </div>
                </div>
              </Button>
            </Link>
          );
        })}
      </nav>

      <div className="mt-8 p-4 bg-accent/30 rounded-lg border border-border/50">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="h-4 w-4 text-analytics-blue" />
          <span className="text-sm font-medium text-analytics-slate">
            Connection Status
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${indicatorColor} animate-pulse`}
          ></div>
          <span className="text-xs text-muted-foreground">{statusText}</span>
        </div>
        <p className="mt-3 text-[11px] leading-tight text-muted-foreground">
          Serving visualisations from{" "}
          <a
            className="underline decoration-dotted hover:text-analytics-blue"
            href="https://sense-demo.qlik.com/sense/app/372cbc85-f7fb-4db6-a620-9a5367845dce"
            target="_blank"
            rel="noreferrer"
          >
            sense-demo.qlik.com
          </a>
        </p>
      </div>

      {/* Filters Section */}
      <div className="mt-6 p-4 bg-accent/20 rounded-lg border border-border/50 relative">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-analytics-blue" />
            <span className="text-sm font-medium text-analytics-slate">
              Filters
            </span>
            {totalActiveFilters > 0 && (
              <Badge variant="secondary" className="text-xs px-2 py-0.5">
                {totalActiveFilters}
              </Badge>
            )}
          </div>
          {totalActiveFilters > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
            >
              Clear All
            </Button>
          )}
        </div>

        {filtersExpanded && (
          <>
            <div className="space-y-3">
              {filterFields.map((field) => {
                const Icon = field.icon;
                const isExpanded = expandedFilter === field.id;
                const activeValues = activeFilters[field.id] || [];
                const hasActiveFilters = activeValues.length > 0;

                return (
                  <div
                    key={field.id}
                    className="border-l-2 border-accent/50 pl-3"
                  >
                    <Button
                      variant="ghost"
                      onClick={() =>
                        setExpandedFilter(isExpanded ? null : field.id)
                      }
                      className="w-full justify-between p-2 h-auto text-left hover:bg-accent/30"
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs font-medium">
                          {field.label}
                        </span>
                        {hasActiveFilters && (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0"
                          >
                            {activeValues.length}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {hasActiveFilters && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              clearFieldFilters(field.id);
                            }}
                            className="h-4 w-4 p-0 hover:bg-destructive/20"
                          >
                            <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                          </Button>
                        )}
                      </div>
                    </Button>

                    {isExpanded && (
                      <div className="mt-2 pl-2 space-y-1">
                        {field.values.map((value) => {
                          const isActive = activeValues.includes(value);
                          const isApplying =
                            applyingFilter === `${field.id}-${value}`;
                          return (
                            <Button
                              key={value}
                              variant={isActive ? "secondary" : "ghost"}
                              size="sm"
                              onClick={() => toggleFilter(field.id, value)}
                              disabled={isApplying || !connected}
                              className={`w-full justify-start text-[11px] h-7 px-2 ${
                                isActive
                                  ? "bg-analytics-blue/10 text-analytics-blue border border-analytics-blue/20"
                                  : "hover:bg-accent/40"
                              } ${isApplying ? "opacity-50" : ""}`}
                            >
                              {isApplying ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 border border-analytics-blue border-t-transparent rounded-full animate-spin" />
                                  {value}
                                </div>
                              ) : (
                                value
                              )}
                            </Button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {!connected && (
              <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded text-[10px] text-amber-700">
                Connect to Qlik Sense to apply filters
              </div>
            )}
          </>
        )}

        {/* Minimize/Maximize toggle - positioned at bottom right */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setFiltersExpanded(!filtersExpanded)}
          className="absolute bottom-2 right-2 h-6 w-6 p-0 text-muted-foreground hover:text-analytics-blue"
          title={filtersExpanded ? "Minimize filters" : "Expand filters"}
        >
          {filtersExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Bookmarks Section */}
      <div className="mt-6 p-4 bg-accent/15 rounded-lg border border-border/50 relative">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Bookmark className="h-4 w-4 text-analytics-blue" />
            <span className="text-sm font-medium text-analytics-slate">
              Bookmarks
            </span>
            {bookmarks.length > 0 && (
              <Badge variant="outline" className="text-xs px-2 py-0.5">
                {bookmarks.length}
              </Badge>
            )}
          </div>
        </div>

        {bookmarksExpanded && (
          <>
            <div className="space-y-2">
              {bookmarks.map((bookmark) => {
                const isApplying = applyingBookmark === bookmark.id;
                return (
                  <Button
                    key={bookmark.id}
                    variant="ghost"
                    onClick={() => applyBookmark(bookmark.id)}
                    disabled={isApplying || !connected}
                    className={`w-full justify-start text-left h-auto p-3 hover:bg-accent/40 ${
                      isApplying ? "opacity-50" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3 w-full">
                      {isApplying ? (
                        <div className="w-4 h-4 border-2 border-analytics-blue border-t-transparent rounded-full animate-spin flex-shrink-0" />
                      ) : (
                        <Bookmark className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      )}
                      <div className="text-left min-w-0 flex-1">
                        <div className="text-sm font-medium text-analytics-slate truncate">
                          {bookmark.title}
                        </div>
                        {bookmark.description && (
                          <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {bookmark.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </Button>
                );
              })}
            </div>

            {bookmarks.length === 0 && connected && (
              <div className="text-center py-4 text-sm text-muted-foreground">
                No bookmarks available
              </div>
            )}

            {!connected && (
              <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded text-[10px] text-amber-700">
                Connect to Qlik Sense to access bookmarks
              </div>
            )}
          </>
        )}

        {/* Minimize/Maximize toggle - positioned at bottom right */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setBookmarksExpanded(!bookmarksExpanded)}
          className="absolute bottom-2 right-2 h-6 w-6 p-0 text-muted-foreground hover:text-analytics-blue"
          title={bookmarksExpanded ? "Minimize bookmarks" : "Expand bookmarks"}
        >
          {bookmarksExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </div>
    </Card>
  );
};
