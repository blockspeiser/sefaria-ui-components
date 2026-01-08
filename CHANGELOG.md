# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2024-01-08

### Added

- **TextBlock** component for displaying Sefaria text sources
  - Automatic category-based color coding
  - Support for bilingual, Hebrew-only, and translation-only display modes
  - Multiple translation version support
  - Follow-up action menu for AI interactions
  - Event handling for clicks and link interactions
  - Optional data fetching from Sefaria API

- **CalendarBlock** component for displaying daily learning calendar items
  - Support for all Sefaria calendar types (Parashat Hashavua, Daf Yomi, etc.)
  - Automatic category-based color coding
  - Haftarah display for Parashat Hashavua
  - Aliyot links for Torah portions
  - Optional text preview with `showText` prop

- **Utility functions**
  - `categoryColor()` for Sefaria category color lookup
  - Color palette with Sefaria's official category colors
  - Follow-up prompt templates for AI integrations
  - Event type definitions for component interactions

- **TypeScript support**
  - Full type definitions for all components and utilities
  - Exported types for SefariaTextResponse, event types, and more

- **Documentation**
  - Interactive component gallery
  - Comprehensive README with usage examples
