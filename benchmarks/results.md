# Benchmark Results

Here are the results from the benchmark. Ran on a Lenovo ThinkPad T14 (i7-10610U CPU @ 1.80GHz, 32GB RAM)

=================================================================

Running Suite: **Markup Parser benchmark, sample: _micro.xml_**

    fast-xml-parser  x 99,420 ops/sec ±1.29% (87 runs sampled)   32%
    xml2js           x 65,676 ops/sec ±0.92% (90 runs sampled)   21%
    parseMarkup      x 308,752 ops/sec ±0.43% (97 runs sampled)  100%

Fastest is **parseMarkup**

=================================================================

Running Suite: **Markup Parser benchmark, sample: _small.xml_**

    fast-xml-parser  x 28,417 ops/sec ±1.92% (91 runs sampled)  33%
    xml2js           x 19,658 ops/sec ±0.67% (93 runs sampled)  23%
    parseMarkup      x 86,154 ops/sec ±0.26% (97 runs sampled)  100%

Fastest is **parseMarkup**

=================================================================

Running Suite: **Markup Parser benchmark, sample: _medium.xml_**

    fast-xml-parser  x 10,701 ops/sec ±0.49% (95 runs sampled)  35%
    xml2js           x 7,445 ops/sec ±1.23% (89 runs sampled)   24%
    parseMarkup      x 30,392 ops/sec ±0.79% (94 runs sampled)  100%

Fastest is **parseMarkup**

=================================================================

Running Suite: **Markup Parser benchmark, sample: _large.xml_**

    fast-xml-parser  x 2,493 ops/sec ±0.64% (89 runs sampled)  40%
    xml2js           x 1,965 ops/sec ±0.69% (88 runs sampled)  32%
    parseMarkup      x 6,219 ops/sec ±1.05% (87 runs sampled)  100%

Fastest is **parseMarkup**

=================================================================
