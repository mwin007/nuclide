'use babel';
/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

import type {Outline, OutlineTree} from '../../nuclide-outline-view';
import type {ClangOutlineTree} from '../../nuclide-clang/lib/rpc-types';
import type {TokenizedText} from '../../nuclide-tokenized-text';

import {Point} from 'atom';
import {trackTiming} from '../../nuclide-analytics';
import {ClangCursorTypes} from '../../nuclide-clang';
import {
  keyword,
  className,
  method,
  param,
  whitespace,
  string,
  plain,
} from '../../nuclide-tokenized-text';
import {getOutline} from './libclang';

// Display friendly names for all class-like types.
const CLASS_KIND_NAMES = {
  [ClangCursorTypes.STRUCT_DECL]: 'struct',
  [ClangCursorTypes.UNION_DECL]: 'union',
  [ClangCursorTypes.CLASS_DECL]: 'class',
  [ClangCursorTypes.ENUM_DECL]: 'enum',
  [ClangCursorTypes.OBJC_INTERFACE_DECL]: '@interface',
  [ClangCursorTypes.OBJC_CATEGORY_DECL]: '@interface',
  [ClangCursorTypes.OBJC_PROTOCOL_DECL]: '@protocol',
  [ClangCursorTypes.OBJC_IMPLEMENTATION_DECL]: '@implementation',
  [ClangCursorTypes.OBJC_CATEGORY_IMPL_DECL]: '@implementation',
  [ClangCursorTypes.CLASS_TEMPLATE]: 'class',
  [ClangCursorTypes.CLASS_TEMPLATE_PARTIAL_SPECIALIZATION]: 'class',
  [ClangCursorTypes.NAMESPACE]: 'namespace',
};

// Collapse template arguments for long types.
const LONG_TYPE_LENGTH = 50;

// TODO(hansonw): Highlight tokens inside types.
function tokenizeType(type: string): TokenizedText {
  if (type.length > LONG_TYPE_LENGTH) {
    const openIndex = type.indexOf('<');
    if (openIndex !== -1) {
      const closeIndex = type.lastIndexOf('>');
      if (closeIndex !== -1) {
        return [
          plain(type.substring(0, openIndex + 1)),
          string('...'),
          plain(type.substring(closeIndex)),
        ];
      }
    }
  }
  return [plain(type)];
}

function tokenizeCursor(cursor: ClangOutlineTree): TokenizedText {
  if (cursor.children != null) {
    return [
      keyword(CLASS_KIND_NAMES[cursor.cursor_kind] || 'class'),
      whitespace(' '),
      className(cursor.name),
    ];
  }
  if (cursor.params != null) {
    const {params, tparams} = cursor;
    const paramTokens = [];
    params.forEach(fparam => {
      if (paramTokens.length > 0) {
        paramTokens.push(plain(', '));
      }
      paramTokens.push(param(fparam));
    });
    const tparamTokens = [];
    if (tparams != null && tparams.length > 0) {
      tparamTokens.push(plain('<'));
      tparams.forEach(tparam => {
        if (tparamTokens.length > 1) {
          tparamTokens.push(plain(', '));
        }
        tparamTokens.push(plain(tparam));
      });
      tparamTokens.push(plain('>'));
    }
    return [
      method(cursor.name),
      ...tparamTokens,
      plain('('),
      ...paramTokens,
      plain(')'),
    ];
  }
  if (cursor.cursor_type != null) {
    return [
      ...tokenizeType(cursor.cursor_type),
      whitespace(' '),
      className(cursor.name),
    ];
  }
  return [plain(cursor.name)];
}

export function outlineFromClangOutline(outline: Array<ClangOutlineTree>): Array<OutlineTree> {
  return outline.map(cursor => {
    return {
      tokenizedText: tokenizeCursor(cursor),
      representativeName: cursor.name,
      startPosition: new Point(
        cursor.extent.start.line,
        cursor.extent.start.column,
      ),
      endPosition: new Point(
        cursor.extent.end.line,
        cursor.extent.end.column,
      ),
      children: cursor.children ? outlineFromClangOutline(cursor.children) : [],
    };
  });
}

export default class OutlineViewHelpers {
  @trackTiming('nuclide-clang-atom:outline-view')
  static async getOutline(editor: atom$TextEditor): Promise<?Outline> {
    const clangOutline = await getOutline(editor);
    if (clangOutline == null) {
      return null;
    }
    return {
      outlineTrees: outlineFromClangOutline(clangOutline),
    };
  }
}
