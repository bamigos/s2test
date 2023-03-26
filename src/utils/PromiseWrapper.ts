class PromiseWrapper<T> {
	public promise: Promise<T>;
	public resolve: (value: T) => void;
	public reject: (reason?: unknown) => void;

	constructor() {
		this.promise = new Promise((_resolve, _reject) => {
			this.resolve = _resolve;
			this.reject = _reject;
		});
	}
}

export default PromiseWrapper;