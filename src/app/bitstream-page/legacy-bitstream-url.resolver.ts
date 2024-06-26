import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  ResolveFn,
  RouterStateSnapshot,
} from '@angular/router';
import { Observable } from 'rxjs';

import { BitstreamDataService } from '../core/data/bitstream-data.service';
import { RemoteData } from '../core/data/remote-data';
import { Bitstream } from '../core/shared/bitstream.model';
import { getFirstCompletedRemoteData } from '../core/shared/operators';
import { hasNoValue } from '../shared/empty.util';

/**
 * Resolve a bitstream based on the handle of the item, and the sequence id or the filename of the
 * bitstream
 *
 * @param {ActivatedRouteSnapshot} route The current ActivatedRouteSnapshot
 * @param {RouterStateSnapshot} state The current RouterStateSnapshot
 * @param {BitstreamDataService} bitstreamDataService
 * @returns Observable<<RemoteData<Item>> Emits the found bitstream based on the parameters in
 * current route, or an error if something went wrong
 */
export const legacyBitstreamUrlResolver: ResolveFn<RemoteData<Bitstream>> = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
  bitstreamDataService: BitstreamDataService = inject(BitstreamDataService),
): Observable<RemoteData<Bitstream>> => {
  const prefix = route.params.prefix;
  const suffix = route.params.suffix;
  const filename = route.params.filename;

  let sequenceId = route.params.sequence_id;
  if (hasNoValue(sequenceId)) {
    sequenceId = route.queryParams.sequenceId;
  }

  return bitstreamDataService.findByItemHandle(
    `${prefix}/${suffix}`,
    sequenceId,
    filename,
  ).pipe(
    getFirstCompletedRemoteData(),
  );
};
