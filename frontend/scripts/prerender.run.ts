/**
 * Build entry point for prerendering. `npm run build` invokes this file.
 *
 * It exists so that prerender.ts is a module you can import - the tests do -
 * without importing it writing files into dist/.
 */
import { main } from './prerender';

main();
