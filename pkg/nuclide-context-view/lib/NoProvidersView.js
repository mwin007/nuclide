'use babel';
/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

import {React} from 'react-for-atom';

export class NoProvidersView extends React.Component {
  render(): React.Element<any> {
    return (
        <div>No providers registered!</div>
    );
  }
}
