Service.ɵfac = function Service_Factory(ɵt) { return new (ɵt || Service)($i0$.ɵɵinject(Dep)); };
Service.ɵprov = /*@__PURE__*/ $i0$.ɵɵdefineInjectable({ token: Service, factory: Service.ɵfac, providedIn: $i0$.forwardRef(() => Mod) });
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && $i0$.ɵsetClassMetadata(Service, [{
    type: Injectable,
    args: [{ providedIn: forwardRef(() => Mod) }]
  }], () => [{ type: Dep }], null);
})();
export class Mod {
}
