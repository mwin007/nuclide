'use babel';
/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

import {trackTiming} from '../../nuclide-analytics';
import {getLogger} from '../../nuclide-logging';

import libclang from './libclang';

export default class CodeFormatHelpers {
  @trackTiming('nuclide-clang-format.formatCode')
  static async formatEntireFile(editor: atom$TextEditor, range: atom$Range): Promise<{
    newCursor?: number;
    formatted: string;
  }> {
    try {
      return await libclang.formatCode(editor, range);
    } catch (e) {
      getLogger().error('Could not run clang-format:', e);
      atom.notifications.addError(
        'Could not run clang-format.<br>Ensure it is installed and in your $PATH.'
      );
      throw e;
    }
  }
}
