/* 코드 테스트 · 수정 모드에서 써지는 코드(연출 1~5마다 10개씩, 총 50개)
 * 수정 모드에 들어갈 때마다 지금 연출의 목록에서 하나를 무작위로 골라(직전 것과 겹치지 않게) 키 한 번에 한 글자씩 써진다.
 * 한 조각을 다 쓰면 같은 연출의 다른 조각이 이어진다. f는 창 제목에 보일 파일 이름이다.
 * 주의: JS 템플릿 문자열이라 역슬래시와 달러+중괄호를 쓰지 않는다(파이썬 f-string의 중괄호는 괜찮다). */
window.CT_CODE = {
  1: [
    { f: 'train.py', c: `import torch
from torch import nn
from torch.utils.data import DataLoader

EPOCHS = 1500


def train(model, loader, opt, sched, device="cuda"):
    model.train()
    loss_fn = nn.CrossEntropyLoss(label_smoothing=0.1)
    for epoch in range(1, EPOCHS + 1):
        total, correct, seen = 0.0, 0, 0
        for x, y in loader:
            x, y = x.to(device), y.to(device)
            opt.zero_grad(set_to_none=True)
            logits = model(x)
            loss = loss_fn(logits, y)
            loss.backward()
            nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            opt.step()
            total += loss.item() * len(y)
            correct += (logits.argmax(1) == y).sum().item()
            seen += len(y)
        sched.step()
        print(f"Epoch {epoch:04d}/{EPOCHS} loss={total / seen:.5f} acc={correct / seen:.4f}")
` },
    { f: 'solve.py', c: `import numpy as np


def sieve(n):
    is_prime = np.ones(n + 1, dtype=bool)
    is_prime[:2] = False
    for p in range(2, int(n ** 0.5) + 1):
        if is_prime[p]:
            is_prime[p * p :: p] = False
    return np.flatnonzero(is_prime)


def pi_count(x, primes):
    return int(np.searchsorted(primes, x, side="right"))


if __name__ == "__main__":
    primes = sieve(1_000_000)
    for k in range(3, 7):
        x = 10 ** k
        print(f"pi(10**{k}) = {pi_count(x, primes)}  x/ln x = {x / np.log(x):.1f}")
` },
    { f: 'newton.py', c: `def newton(f, df, x0, tol=1e-12, max_iter=50):
    x = x0
    for i in range(1, max_iter + 1):
        fx, dfx = f(x), df(x)
        if dfx == 0:
            raise ZeroDivisionError("derivative vanished")
        step = fx / dfx
        x -= step
        print(f"iter {i:2d}  x = {x:.12f}  |step| = {abs(step):.2e}")
        if abs(step) < tol:
            return x
    raise RuntimeError("did not converge")


root = newton(lambda x: x ** 3 - 2 * x - 5, lambda x: 3 * x ** 2 - 2, x0=2.0)
print(f"root = {root:.12f}")
` },
    { f: 'montecarlo.py', c: `import numpy as np

rng = np.random.default_rng(seed=42)


def estimate_pi(n, batch=1_000_000):
    inside = 0
    done = 0
    while done < n:
        m = min(batch, n - done)
        xy = rng.random((m, 2))
        inside += np.count_nonzero((xy ** 2).sum(axis=1) <= 1.0)
        done += m
    return 4.0 * inside / n


for k in range(10, 25, 2):
    n = 2 ** k
    est = estimate_pi(n)
    print(f"N = {n:>9d}  pi ~ {est:.6f}  |err| = {abs(est - np.pi):.2e}")
` },
    { f: 'gradient.py', c: `import numpy as np


def f(p):
    x, y = p
    return (1 - x) ** 2 + 100 * (y - x ** 2) ** 2


def grad(p):
    x, y = p
    return np.array([-2 * (1 - x) - 400 * x * (y - x ** 2), 200 * (y - x ** 2)])


def adam(p, lr=1e-3, b1=0.9, b2=0.999, eps=1e-8, steps=20000):
    m = np.zeros_like(p)
    v = np.zeros_like(p)
    for t in range(1, steps + 1):
        g = grad(p)
        m = b1 * m + (1 - b1) * g
        v = b2 * v + (1 - b2) * g * g
        p = p - lr * (m / (1 - b1 ** t)) / (np.sqrt(v / (1 - b2 ** t)) + eps)
        if t % 2000 == 0:
            print(f"step {t:5d}  p = {p.round(6)}  f = {f(p):.3e}")
    return p
` },
    { f: 'linalg.py', c: `import numpy as np

rng = np.random.default_rng(7)
A = rng.normal(size=(6, 6))
A = A @ A.T + 6 * np.eye(6)

L = np.linalg.cholesky(A)
b = rng.normal(size=6)
y = np.linalg.solve(L, b)
x = np.linalg.solve(L.T, y)

eigvals = np.linalg.eigvalsh(A)
print("cond(A)  =", eigvals.max() / eigvals.min())
print("det(A)   =", np.prod(np.diag(L)) ** 2)
print("residual =", np.linalg.norm(A @ x - b))
` },
    { f: 'integrate.py', c: `import math


def simpson(f, a, b, n):
    if n % 2:
        n += 1
    h = (b - a) / n
    s = f(a) + f(b)
    for i in range(1, n):
        s += (4 if i % 2 else 2) * f(a + i * h)
    return s * h / 3


def romberg(f, a, b, levels=6):
    table = [[0.5 * (b - a) * (f(a) + f(b))]]
    for k in range(1, levels):
        h = (b - a) / 2 ** k
        mid = sum(f(a + (2 * i - 1) * h) for i in range(1, 2 ** (k - 1) + 1))
        row = [0.5 * table[-1][0] + h * mid]
        for j in range(1, k + 1):
            row.append(row[j - 1] + (row[j - 1] - table[-1][j - 1]) / (4 ** j - 1))
        table.append(row)
    return table[-1][-1]


print(simpson(math.sin, 0, math.pi, 64), romberg(math.sin, 0, math.pi))
` },
    { f: 'stats.py', c: `import numpy as np
from dataclasses import dataclass


@dataclass
class Summary:
    mean: float
    std: float
    median: float
    ci95: tuple


def summarize(x, n_boot=2000, seed=0):
    rng = np.random.default_rng(seed)
    boots = rng.choice(x, size=(n_boot, len(x)), replace=True).mean(axis=1)
    lo, hi = np.percentile(boots, [2.5, 97.5])
    return Summary(x.mean(), x.std(ddof=1), float(np.median(x)), (lo, hi))


samples = np.random.default_rng(1).lognormal(mean=1.2, sigma=0.4, size=500)
print(summarize(samples))
` },
    { f: 'benchmark.py', c: `import random
import time
from statistics import mean, stdev


def bench(fn, data, repeat=7):
    times = []
    for _ in range(repeat):
        arr = list(data)
        t0 = time.perf_counter()
        fn(arr)
        times.append(time.perf_counter() - t0)
    return mean(times), stdev(times)


for n in (10 ** 3, 10 ** 4, 10 ** 5, 10 ** 6):
    data = [random.randint(0, n) for _ in range(n)]
    avg, sd = bench(sorted, data)
    print(f"n = {n:>8d}  {avg:.4f}s +/- {sd:.4f}  ({n / avg / 1e6:.2f} M items/s)")
` },
    { f: 'test_math.py', c: `import math

import pytest

from solver import newton, simpson


@pytest.mark.parametrize("a", [2, 3, 10, 99])
def test_newton_sqrt(a):
    root = newton(lambda x: x * x - a, lambda x: 2 * x, x0=a)
    assert root == pytest.approx(math.sqrt(a), rel=1e-12)


@pytest.mark.parametrize("n", [8, 16, 64])
def test_simpson_sin(n):
    assert simpson(math.sin, 0, math.pi, n) == pytest.approx(2.0, abs=1e-3)


def test_simpson_odd_n_is_rounded_up():
    assert simpson(lambda x: x, 0, 1, 3) == pytest.approx(0.5)
` },
  ],
  2: [
    { f: 'attention.py', c: `import math

import torch
from torch import nn
import torch.nn.functional as F


class CausalSelfAttention(nn.Module):
    def __init__(self, d_model, n_heads, dropout=0.0):
        super().__init__()
        assert d_model % n_heads == 0
        self.n_heads = n_heads
        self.qkv = nn.Linear(d_model, 3 * d_model, bias=False)
        self.proj = nn.Linear(d_model, d_model, bias=False)
        self.dropout = dropout

    def forward(self, x):
        B, T, C = x.shape
        q, k, v = self.qkv(x).split(C, dim=2)
        q, k, v = (t.view(B, T, self.n_heads, C // self.n_heads).transpose(1, 2) for t in (q, k, v))
        y = F.scaled_dot_product_attention(q, k, v, is_causal=True, dropout_p=self.dropout if self.training else 0.0)
        return self.proj(y.transpose(1, 2).contiguous().view(B, T, C))
` },
    { f: 'rope.py', c: `import torch


def rope_frequencies(dim, max_len, base=10000.0, scale=1.0):
    inv = 1.0 / (base ** (torch.arange(0, dim, 2).float() / dim))
    t = torch.arange(max_len).float() / scale
    freqs = torch.outer(t, inv)
    return torch.polar(torch.ones_like(freqs), freqs)


def apply_rope(x, freqs):
    xc = torch.view_as_complex(x.float().reshape(*x.shape[:-1], -1, 2))
    out = torch.view_as_real(xc * freqs[: x.shape[-2]]).flatten(-2)
    return out.type_as(x)


freqs = rope_frequencies(dim=128, max_len=131072, base=500000.0)
print(freqs.shape, freqs.dtype)
` },
    { f: 'pretrain.py', c: `import math

import torch

from model import Transformer
from data import ShardedLoader

cfg = dict(d_model=2048, n_layers=24, n_heads=16, ctx=8192, vocab=128000)
model = Transformer(**cfg).cuda()
opt = torch.optim.AdamW(model.parameters(), lr=3e-4, betas=(0.9, 0.95), weight_decay=0.1)
loader = ShardedLoader("data/mixture-v3", seq_len=cfg["ctx"], batch_size=8)


def lr_at(step, warmup=2000, total=200_000, peak=3e-4, floor=3e-5):
    if step < warmup:
        return peak * step / warmup
    p = (step - warmup) / (total - warmup)
    return floor + 0.5 * (peak - floor) * (1 + math.cos(math.pi * p))


for step, (x, y) in enumerate(loader, start=1):
    for g in opt.param_groups:
        g["lr"] = lr_at(step)
    with torch.autocast("cuda", dtype=torch.bfloat16):
        loss = model(x, targets=y)
    loss.backward()
    torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
    opt.step()
    opt.zero_grad(set_to_none=True)
    if step % 50 == 0:
        print(f"step {step:07d} | loss {loss.item():.4f} | ppl {math.exp(loss.item()):.2f}")
` },
    { f: 'evaluate.py', c: `import json

import torch

from model import load_checkpoint
from tasks import TASKS


@torch.no_grad()
def score_multiple_choice(model, tok, item):
    scores = []
    for choice in item["choices"]:
        ids = tok.encode(item["question"] + " " + choice)
        logits = model(torch.tensor([ids]).cuda())
        logp = logits.log_softmax(-1)[0, :-1].gather(1, torch.tensor(ids[1:]).cuda()[:, None])
        scores.append(logp.sum().item() / len(ids))
    return int(max(range(len(scores)), key=scores.__getitem__) == item["answer"])


model, tok = load_checkpoint("ckpt/step_120000")
results = {}
for name, items in TASKS.items():
    acc = sum(score_multiple_choice(model, tok, it) for it in items) / len(items)
    results[name] = round(100 * acc, 2)
    print(f"{name:<18} {results[name]:6.2f}")
json.dump(results, open("eval/step_120000.json", "w"), indent=2)
` },
    { f: 'sampling.py', c: `import torch


@torch.no_grad()
def generate(model, idx, max_new_tokens, temperature=0.7, top_p=0.9, eos_id=None):
    for _ in range(max_new_tokens):
        logits = model(idx[:, -model.ctx :])[:, -1, :] / max(temperature, 1e-5)
        probs = logits.softmax(-1)
        sorted_p, sorted_i = probs.sort(descending=True)
        cum = sorted_p.cumsum(-1)
        sorted_p[cum - sorted_p > top_p] = 0.0
        sorted_p /= sorted_p.sum(-1, keepdim=True)
        nxt = sorted_i.gather(-1, torch.multinomial(sorted_p, 1))
        idx = torch.cat([idx, nxt], dim=1)
        if eos_id is not None and (nxt == eos_id).all():
            break
    return idx
` },
    { f: 'scaling_fit.py', c: `import numpy as np
from scipy.optimize import curve_fit

N = np.array([1.25e8, 3.5e8, 1.3e9, 2.7e9, 7e9, 1.3e10])
loss = np.array([3.31, 2.98, 2.71, 2.58, 2.44, 2.36])


def law(n, E, A, alpha):
    return E + A / n ** alpha


(E, A, alpha), cov = curve_fit(law, N, loss, p0=(1.7, 400.0, 0.3), maxfev=20000)
err = np.sqrt(np.diag(cov))
print(f"E = {E:.3f} +/- {err[0]:.3f}   alpha = {alpha:.3f} +/- {err[2]:.3f}")
for n in (3.4e10, 7e10, 4e11):
    print(f"predicted L({n:.1e}) = {law(n, E, A, alpha):.4f}")
` },
    { f: 'lora.py', c: `import math

import torch
from torch import nn


class LoRALinear(nn.Module):
    def __init__(self, base: nn.Linear, r=16, alpha=32, dropout=0.05):
        super().__init__()
        self.base = base
        self.base.weight.requires_grad_(False)
        self.A = nn.Parameter(torch.empty(r, base.in_features))
        self.B = nn.Parameter(torch.zeros(base.out_features, r))
        nn.init.kaiming_uniform_(self.A, a=math.sqrt(5))
        self.scale = alpha / r
        self.drop = nn.Dropout(dropout)

    def forward(self, x):
        return self.base(x) + (self.drop(x) @ self.A.T @ self.B.T) * self.scale

    @torch.no_grad()
    def merge(self):
        self.base.weight += (self.B @ self.A) * self.scale
        return self.base
` },
    { f: 'ppo.py', c: `import torch


def ppo_loss(logp_new, logp_old, advantages, clip=0.2):
    ratio = (logp_new - logp_old).exp()
    unclipped = ratio * advantages
    clipped = ratio.clamp(1 - clip, 1 + clip) * advantages
    clipfrac = ((ratio - 1).abs() > clip).float().mean()
    return -torch.min(unclipped, clipped).mean(), clipfrac


def kl_penalty(logp_policy, logp_ref, beta=0.05):
    return beta * (logp_policy - logp_ref).mean()


def gae(rewards, values, gamma=1.0, lam=0.95):
    adv = torch.zeros_like(rewards)
    last = 0.0
    for t in reversed(range(len(rewards))):
        nxt = values[t + 1] if t + 1 < len(values) else 0.0
        delta = rewards[t] + gamma * nxt - values[t]
        last = delta + gamma * lam * last
        adv[t] = last
    return adv
` },
    { f: 'probe.py', c: `import torch

from model import load_checkpoint

model, tok = load_checkpoint("ckpt/step_080000")
text = "The cat sat on the mat. The cat sat on the"
ids = torch.tensor([tok.encode(text)]).cuda()

attn = {}


def hook(layer):
    def fn(module, inputs, output):
        attn[layer] = output[1].detach()
    return fn


for i, block in enumerate(model.blocks):
    block.attn.register_forward_hook(hook(i))

with torch.no_grad():
    model(ids, return_attn=True)

for layer, a in attn.items():
    entropy = -(a * a.clamp_min(1e-9).log()).sum(-1).mean().item()
    print(f"layer {layer:02d}  entropy={entropy:.3f}")
` },
    { f: 'tokenizer_stats.py', c: `from collections import Counter

from tokenizers import Tokenizer

tok = Tokenizer.from_file("tokenizer/bpe-128k.json")
counts = Counter()
n_bytes = n_tokens = 0

with open("data/val-00042.txt", encoding="utf-8") as fh:
    for line in fh:
        enc = tok.encode(line)
        counts.update(enc.ids)
        n_bytes += len(line.encode("utf-8"))
        n_tokens += len(enc.ids)

print(f"vocab used   : {len(counts):,} / {tok.get_vocab_size():,}")
print(f"bytes/token  : {n_bytes / n_tokens:.3f}")
for tid, c in counts.most_common(8):
    print(f"  {tok.id_to_token(tid)!r:>12}  {c:,}")
` },
  ],
  3: [
    { f: 'agent.py', c: `from dataclasses import dataclass, field

from llm import chat
from tools import TOOLS


@dataclass
class Agent:
    goal: str
    history: list = field(default_factory=list)
    max_steps: int = 20

    def run(self):
        self.history.append({"role": "user", "content": self.goal})
        for step in range(self.max_steps):
            reply = chat(self.history, tools=list(TOOLS.values()))
            self.history.append(reply.message)
            if not reply.tool_calls:
                return reply.message["content"]
            for call in reply.tool_calls:
                result = TOOLS[call.name](**call.arguments)
                print(f"[step {step}] {call.name} -> {str(result)[:80]}")
                self.history.append({"role": "tool", "name": call.name, "content": str(result)})
        return "stopped: step limit reached"
` },
    { f: 'tools.py', c: `import duckdb
import pandas as pd

con = duckdb.connect("warehouse.duckdb", read_only=True)


def sql_query(query: str, limit: int = 200) -> str:
    """Run a read-only SQL query and return a small markdown table."""
    if not query.lstrip().lower().startswith(("select", "with")):
        return "error: only SELECT queries are allowed"
    df = con.execute(query).fetch_df().head(limit)
    return df.to_markdown(index=False)


def describe(table: str, columns: list) -> str:
    df = con.execute(f"SELECT {', '.join(columns)} FROM {table}").fetch_df()
    return df.describe().round(3).to_markdown()


TOOLS = {"sql_query": sql_query, "describe": describe}
` },
    { f: 'profile.py', c: `import pandas as pd

df = pd.read_parquet("data/sales_2026q3.parquet")

report = pd.DataFrame({
    "dtype": df.dtypes.astype(str),
    "nulls": df.isna().sum(),
    "null_pct": (df.isna().mean() * 100).round(2),
    "unique": df.nunique(),
})
print(report.sort_values("null_pct", ascending=False).head(15))

num = df.select_dtypes("number")
print(num.describe(percentiles=[0.05, 0.5, 0.95]).T.round(3))
print("rows:", len(df), " columns:", df.shape[1])
` },
    { f: 'segment.py', c: `import pandas as pd

df = pd.read_parquet("data/sales_2026q3.parquet")
df["week"] = pd.to_datetime(df["order_date"]).dt.to_period("W").dt.start_time

weekly = (
    df.groupby(["region", "week"], as_index=False)
    .agg(revenue=("revenue", "sum"), orders=("order_id", "nunique"))
    .assign(aov=lambda d: d.revenue / d.orders)
)
baseline = weekly[weekly.week < "2026-08-01"].groupby("region").revenue.mean()
recent = weekly[weekly.week >= "2026-08-01"].groupby("region").revenue.mean()
change = ((recent - baseline) / baseline * 100).round(1).sort_values()
print(change.to_string())
` },
    { f: 'hypothesis.py', c: `import numpy as np
from scipy import stats

rng = np.random.default_rng(0)


def welch(a, b):
    t, p = stats.ttest_ind(a, b, equal_var=False)
    d = (a.mean() - b.mean()) / np.sqrt((a.var(ddof=1) + b.var(ddof=1)) / 2)
    return t, p, d


def bootstrap_diff(a, b, n=5000):
    diffs = [rng.choice(a, len(a)).mean() - rng.choice(b, len(b)).mean() for _ in range(n)]
    return np.percentile(diffs, [2.5, 97.5])


a = df.loc[df.region == "north", "revenue"].to_numpy()
b = df.loc[df.region != "north", "revenue"].to_numpy()
t, p, d = welch(a, b)
print(f"t={t:.3f} p={p:.4f} d={d:.3f} ci={bootstrap_diff(a, b).round(2)}")
` },
    { f: 'anomaly.py', c: `import pandas as pd
from sklearn.ensemble import IsolationForest

df = pd.read_csv("data/sensor_fleet.csv", parse_dates=["ts"])
features = ["temp", "vibration", "rpm", "error_rate"]

roll = df.groupby("device")[features].transform(lambda s: s.rolling(60, min_periods=10).mean())
X = (df[features] - roll).fillna(0)

model = IsolationForest(n_estimators=300, contamination=0.005, random_state=7)
df["score"] = -model.fit(X).score_samples(X)
df["anomaly"] = model.predict(X) == -1

top = df[df.anomaly].sort_values("score", ascending=False)
print(top[["ts", "device", *features, "score"]].head(20).to_string(index=False))
` },
    { f: 'drivers.py', c: `import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.inspection import permutation_importance
from sklearn.model_selection import train_test_split

df = pd.read_parquet("data/sales_2026q3.parquet")
X = pd.get_dummies(df[["region", "channel", "discount", "units", "price"]], drop_first=True)
y = df["margin"]

X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=1)
model = GradientBoostingRegressor(n_estimators=400, max_depth=3, learning_rate=0.05).fit(X_tr, y_tr)
print("R^2 test:", round(model.score(X_te, y_te), 4))

imp = permutation_importance(model, X_te, y_te, n_repeats=10, random_state=1)
ranking = pd.Series(imp.importances_mean, index=X.columns).sort_values(ascending=False)
print(ranking.head(10).round(4).to_string())
` },
    { f: 'planner.py', c: `PLAN = [
    "load and profile the dataset",
    "clean nulls and fix types",
    "segment the metric by region and channel",
    "test the top two hypotheses",
    "model drivers and rank them",
    "write findings with charts",
]


def next_step(done, observations):
    for i, step in enumerate(PLAN):
        if step not in done:
            if observations.get("schema_drift") and i > 1:
                return PLAN[1]
            return step
    return None


def revise(plan, rejected):
    keep = [s for s in plan if rejected not in s]
    return keep + [f"look for an alternative to: {rejected}"]
` },
    { f: 'report.py', c: `from datetime import date
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt


def chart(series, title, path):
    fig, ax = plt.subplots(figsize=(7, 3))
    series.plot(ax=ax, linewidth=1.6)
    ax.set_title(title)
    ax.grid(alpha=0.3)
    fig.tight_layout()
    fig.savefig(path, dpi=150)
    plt.close(fig)


def write_report(findings, out="report.md"):
    lines = [f"# Metric drop analysis ({date.today()})", ""]
    for i, f in enumerate(findings, start=1):
        lines += [f"## {i}. {f['title']}", f["summary"], f"![chart]({f['chart']})", ""]
    Path(out).write_text(chr(10).join(lines), encoding="utf-8")
` },
    { f: 'join_sources.py', c: `import pandas as pd

orders = pd.read_parquet("data/orders.parquet")
calendar = pd.read_csv("data/calendar.csv", parse_dates=["date"])
regions = pd.read_json("data/regions.jsonl", lines=True)

df = (
    orders.merge(calendar, left_on="order_date", right_on="date", how="left", validate="many_to_one")
    .merge(regions, on="store_id", how="left", validate="many_to_one")
)

missing = df["region"].isna().mean()
print(f"rows={len(df):,}  unmatched region={missing:.2%}")
holiday_effect = df.groupby("is_holiday")["revenue"].mean()
print(holiday_effect.round(2).to_string())
df.to_parquet("data/orders_enriched.parquet", index=False)
` },
  ],
  4: [
    { f: 'ping_stats.py', c: `import asyncio
import statistics
import time


async def tcp_ping(host, port=443, timeout=2.0):
    t0 = time.perf_counter()
    try:
        _, writer = await asyncio.wait_for(asyncio.open_connection(host, port), timeout)
        writer.close()
        await writer.wait_closed()
        return (time.perf_counter() - t0) * 1000
    except (OSError, asyncio.TimeoutError):
        return None


async def probe(host, count=20):
    rtts = [await tcp_ping(host) for _ in range(count)]
    ok = [r for r in rtts if r is not None]
    loss = 100 * (1 - len(ok) / count)
    print(f"{host}: loss={loss:.1f}% min/avg/max/mdev = "
          f"{min(ok):.2f}/{statistics.mean(ok):.2f}/{max(ok):.2f}/{statistics.pstdev(ok):.2f} ms")


asyncio.run(probe("api.example.net"))
` },
    { f: 'traceroute.py', c: `import socket
import time


def traceroute(dest, max_hops=30, port=33434, timeout=2.0):
    dest_ip = socket.gethostbyname(dest)
    for ttl in range(1, max_hops + 1):
        recv = socket.socket(socket.AF_INET, socket.SOCK_RAW, socket.IPPROTO_ICMP)
        send = socket.socket(socket.AF_INET, socket.SOCK_DGRAM, socket.IPPROTO_UDP)
        send.setsockopt(socket.SOL_IP, socket.IP_TTL, ttl)
        recv.settimeout(timeout)
        t0 = time.perf_counter()
        send.sendto(b"", (dest_ip, port))
        try:
            _, addr = recv.recvfrom(512)
            print(f"{ttl:2d}  {addr[0]:<16} {(time.perf_counter() - t0) * 1000:.3f} ms")
        except socket.timeout:
            addr = None
            print(f"{ttl:2d}  * * *")
        finally:
            send.close()
            recv.close()
        if addr and addr[0] == dest_ip:
            break
` },
    { f: 'mtu_probe.py', c: `import subprocess


def df_ping(host, size):
    cmd = ["ping", "-c", "1", "-M", "do", "-s", str(size), "-W", "1", host]
    return subprocess.run(cmd, capture_output=True).returncode == 0


def path_mtu(host, lo=1200, hi=9000):
    best = lo
    while lo <= hi:
        mid = (lo + hi) // 2
        if df_ping(host, mid):
            best, lo = mid, mid + 1
        else:
            hi = mid - 1
    return best + 28


mtu = path_mtu("10.40.0.20")
print(f"path MTU = {mtu} bytes  (recommended MSS = {mtu - 40})")
` },
    { f: 'snmp_poll.py', c: `import asyncio
from collections import defaultdict

from snmp import get_bulk

DEVICES = ["core-sw-01.lan", "core-sw-02.lan", "dist-sw-03.lan", "edge-01.lan"]
IF_IN = "1.3.6.1.2.1.31.1.1.1.6"
IF_OUT = "1.3.6.1.2.1.31.1.1.1.10"
last = defaultdict(dict)


async def poll(device, interval=30):
    while True:
        counters = await get_bulk(device, [IF_IN, IF_OUT], community="monitor-ro")
        for ifindex, (rx, tx) in counters.items():
            prev = last[device].get(ifindex)
            if prev:
                rx_bps = (rx - prev[0]) * 8 / interval
                tx_bps = (tx - prev[1]) * 8 / interval
                print(f"{device:<16} if{ifindex:<3} rx={rx_bps / 1e6:8.1f} Mb/s tx={tx_bps / 1e6:8.1f} Mb/s")
            last[device][ifindex] = (rx, tx)
        await asyncio.sleep(interval)


async def main():
    await asyncio.gather(*(poll(d) for d in DEVICES))
` },
    { f: 'dns_check.py', c: `import time

import dns.resolver

RESOLVERS = {"internal": "10.0.0.53", "secondary": "10.0.1.53"}
NAMES = ["api.example.net", "cdn.example.net", "db-replica.example.com"]


def check(name, server):
    r = dns.resolver.Resolver(configure=False)
    r.nameservers = [server]
    r.lifetime = 2.0
    t0 = time.perf_counter()
    answer = r.resolve(name, "A")
    ms = (time.perf_counter() - t0) * 1000
    return sorted(a.to_text() for a in answer), answer.rrset.ttl, ms


for name in NAMES:
    results = {k: check(name, v) for k, v in RESOLVERS.items()}
    consistent = len({tuple(r[0]) for r in results.values()}) == 1
    for k, (ips, ttl, ms) in results.items():
        print(f"{name:<24} {k:<10} {', '.join(ips):<32} ttl={ttl:<5} {ms:6.1f} ms")
    print("  consistent" if consistent else "  MISMATCH between resolvers")
` },
    { f: 'iperf_matrix.py', c: `import itertools
import json
import subprocess

SITES = {"SEL": "10.10.0.20", "TYO": "10.20.0.20", "SIN": "10.30.0.20", "FRA": "10.40.0.20"}


def throughput(src, dst, seconds=5):
    cmd = ["ssh", src, "iperf3", "-c", dst, "-t", str(seconds), "-J"]
    out = json.loads(subprocess.run(cmd, capture_output=True, text=True, check=True).stdout)
    end = out["end"]["sum_received"]
    return end["bits_per_second"] / 1e9, out["end"]["sum_sent"].get("retransmits", 0)


matrix = {}
for (a, ip_a), (b, ip_b) in itertools.permutations(SITES.items(), 2):
    gbps, retr = throughput(ip_a, ip_b)
    matrix[(a, b)] = gbps
    print(f"{a} -> {b}: {gbps:6.2f} Gbit/s  retr={retr}")
` },
    { f: 'bgp_watch.py', c: `from dataclasses import dataclass

from routers import show_bgp


@dataclass(frozen=True)
class Route:
    prefix: str
    next_hop: str
    as_path: tuple
    local_pref: int


def snapshot(router):
    return {r["prefix"]: Route(r["prefix"], r["next_hop"], tuple(r["as_path"]), r["local_pref"])
            for r in show_bgp(router) if r["best"]}


def diff(old, new):
    for prefix in sorted(old.keys() | new.keys()):
        a, b = old.get(prefix), new.get(prefix)
        if a != b:
            kind = "withdrawn" if b is None else "new" if a is None else "changed"
            print(f"{kind:<10} {prefix:<20} {a and a.as_path} -> {b and b.as_path}")
` },
    { f: 'flow_top.py', c: `from collections import Counter
from ipaddress import ip_address, ip_network

from netflow import read_flows

INTERNAL = ip_network("10.0.0.0/8")
talkers = Counter()
ports = Counter()

for flow in read_flows("flows/2026-11-27T09.nfcap"):
    src, dst = ip_address(flow.src), ip_address(flow.dst)
    direction = "out" if src in INTERNAL and dst not in INTERNAL else "in"
    talkers[(flow.src, direction)] += flow.bytes
    ports[flow.dst_port] += flow.packets

print("top talkers")
for (ip, direction), b in talkers.most_common(10):
    print(f"  {ip:<16} {direction:<3} {b / 1e9:8.2f} GB")
print("top ports", ports.most_common(5))
` },
    { f: 'lldp_topology.py', c: `import networkx as nx

from devices import inventory, lldp_neighbors

G = nx.Graph()
for dev in inventory():
    for n in lldp_neighbors(dev):
        G.add_edge(dev, n["system_name"], local=n["local_port"], remote=n["remote_port"])

print(f"devices={G.number_of_nodes()} links={G.number_of_edges()}")
for dev, degree in sorted(G.degree, key=lambda x: -x[1])[:8]:
    print(f"  {dev:<20} links={degree}")

articulation = list(nx.articulation_points(G))
print("single points of failure:", articulation or "none")
path = nx.shortest_path(G, "edge-01.lan", "core-sw-02.lan")
print("path:", " -> ".join(path))
` },
    { f: 'latency_heatmap.py', c: `import numpy as np

SITES = ["SEL", "TYO", "SIN", "FRA", "IAD", "SJC"]


def load_rtt(path="probes/rtt_matrix.npy"):
    m = np.load(path)
    return (m + m.T) / 2


def classify(ms):
    return "ok" if ms < 60 else "warn" if ms < 150 else "high"


rtt = load_rtt()
print("rtt ms " + "".join(f"{s:>7}" for s in SITES))
for i, a in enumerate(SITES):
    cells = "".join(f"{rtt[i, j]:7.0f}" if i != j else "      -" for j in range(len(SITES)))
    print(f"{a:<7}{cells}")
worst = np.unravel_index(np.argmax(rtt), rtt.shape)
print(f"worst pair: {SITES[worst[0]]}-{SITES[worst[1]]} {rtt[worst]:.0f} ms ({classify(rtt[worst])})")
` },
  ],
  5: [
    { f: 'auth_guard.py', c: `import time
from collections import defaultdict, deque

WINDOW = 60
THRESHOLD = 20
BLOCK_TTL = 3600

failures = defaultdict(deque)
blocked = {}


def on_auth_event(ip, ok, now=None):
    now = now or time.time()
    if ip in blocked and blocked[ip] > now:
        return "blocked"
    if ok:
        failures.pop(ip, None)
        return "ok"
    q = failures[ip]
    q.append(now)
    while q and now - q[0] > WINDOW:
        q.popleft()
    if len(q) > THRESHOLD:
        blocked[ip] = now + BLOCK_TTL
        print(f"auth-guard: {ip} failed={len(q)} in {WINDOW}s -> blocked")
        return "blocked"
    return "watch"
` },
    { f: 'fim.py', c: `import hashlib
import json
from pathlib import Path

WATCH = ["/etc/passwd", "/etc/sudoers", "/etc/ssh/sshd_config", "/usr/bin/sshd"]


def sha256(path, chunk=1 << 20):
    h = hashlib.sha256()
    with open(path, "rb") as fh:
        for block in iter(lambda: fh.read(chunk), b""):
            h.update(block)
    return h.hexdigest()


def verify(baseline_file="fim_baseline.json"):
    baseline = json.loads(Path(baseline_file).read_text())
    for path in WATCH:
        now = sha256(path)
        status = "OK" if baseline.get(path) == now else "CHANGED"
        print(f"{status:<8} {path:<26} {now[:16]}")
` },
    { f: 'tls_audit.py', c: `import socket
import ssl
from datetime import datetime, timezone

HOSTS = ["www.example.com", "api.example.com", "vpn.example.com", "sso.example.com"]


def inspect(host, port=443):
    ctx = ssl.create_default_context()
    with socket.create_connection((host, port), timeout=5) as sock:
        with ctx.wrap_socket(sock, server_hostname=host) as tls:
            cert = tls.getpeercert()
            expires = datetime.strptime(cert["notAfter"], "%b %d %H:%M:%S %Y %Z").replace(tzinfo=timezone.utc)
            days = (expires - datetime.now(timezone.utc)).days
            return tls.version(), tls.cipher()[0], days


for host in HOSTS:
    version, cipher, days = inspect(host)
    flag = "RENEW" if days < 14 else "ok"
    print(f"{host:<20} {version:<8} {cipher:<28} {days:>4}d  {flag}")
` },
    { f: 'ids_rules.py', c: `import re
from dataclasses import dataclass


@dataclass
class Rule:
    sid: int
    name: str
    priority: int
    pattern: re.Pattern


RULES = [
    Rule(2041, "SCAN-SWEEP", 2, re.compile(r"SYN .* dpt=(?:22|23|445|3389)")),
    Rule(3107, "DNS-TUNNEL", 1, re.compile(r"query=[a-z0-9]{40,}")),
    Rule(4410, "HTTP-INJECT", 1, re.compile(r"(?i)union[+ ]select|<script")),
]


def match(line):
    for rule in RULES:
        if rule.pattern.search(line):
            yield rule


with open("logs/edge.log", encoding="utf-8") as fh:
    for line in fh:
        for r in match(line):
            print(f"ALERT p{r.priority} sid={r.sid} {r.name}: {line[:90]}")
` },
    { f: 'firewall_sync.py', c: `import ipaddress
import json
from pathlib import Path

feed = json.loads(Path("intel/blocklist.json").read_text())
allow = {ipaddress.ip_network(n) for n in Path("config/allowlist.txt").read_text().split()}


def safe(net):
    return not any(net.overlaps(a) for a in allow)


networks = sorted({ipaddress.ip_network(n, strict=False) for n in feed["indicators"]})
collapsed = list(ipaddress.collapse_addresses(n for n in networks if safe(n)))

rules = [f"add element inet filter blocklist {{ {net} }}" for net in collapsed]
Path("build/blocklist.nft").write_text(chr(10).join(rules), encoding="utf-8")
print(f"indicators={len(feed['indicators'])} collapsed={len(collapsed)} skipped={len(networks) - len(collapsed)}")
` },
    { f: 'beacon_detect.py', c: `import numpy as np
import pandas as pd

flows = pd.read_parquet("flows/egress_24h.parquet")
flows = flows.sort_values(["src", "dst", "ts"])

rows = []
for (src, dst), g in flows.groupby(["src", "dst"]):
    if len(g) < 20:
        continue
    gaps = g["ts"].diff().dt.total_seconds().dropna().to_numpy()
    cv = gaps.std() / gaps.mean()
    rows.append({"src": src, "dst": dst, "n": len(g), "period_s": float(np.median(gaps)), "cv": cv})

suspects = pd.DataFrame(rows).query("cv < 0.1 and period_s < 600").sort_values("cv")
print(suspects.head(15).to_string(index=False))
` },
    { f: 'port_entropy.py', c: `import math
from collections import Counter

from netflow import read_flows


def entropy(counter):
    total = sum(counter.values())
    return -sum(c / total * math.log2(c / total) for c in counter.values())


window = Counter()
baseline = 3.1

for flow in read_flows("flows/dmz_5m.nfcap"):
    window[flow.dst_port] += 1

h = entropy(window)
score = min(1.0, max(0.0, (h - baseline) / 5.5))
level = "ALERT" if score > 0.7 else "watch" if score > 0.4 else "normal"
print(f"H={h:.3f} bits  unique_ports={len(window)}  anomaly={score:.3f}  {level}")
` },
    { f: 'password_policy.py', c: `import hashlib
import hmac
import os

ITERATIONS = 600_000


def hash_password(password: str) -> str:
    salt = os.urandom(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, ITERATIONS)
    return f"pbkdf2_sha256:{ITERATIONS}:{salt.hex()}:{digest.hex()}"


def verify_password(password: str, stored: str) -> bool:
    _, iters, salt_hex, digest_hex = stored.split(":")
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt_hex), int(iters))
    return hmac.compare_digest(digest.hex(), digest_hex)


def strong_enough(password: str) -> bool:
    classes = sum(any(f(c) for c in password) for f in (str.islower, str.isupper, str.isdigit))
    return len(password) >= 12 and classes >= 2
` },
    { f: 'asset_audit.py', c: `import socket
from concurrent.futures import ThreadPoolExecutor

INVENTORY = {"web-01": "10.20.1.11", "web-02": "10.20.1.12", "db-01": "10.20.2.21", "build-01": "10.20.3.31"}
EXPECTED = {"web": {80, 443}, "db": {5432}, "build": {22, 443}}
CHECK = [21, 22, 23, 80, 443, 3389, 5432, 6379, 8080]


def is_open(ip, port, timeout=0.5):
    with socket.socket() as s:
        s.settimeout(timeout)
        return s.connect_ex((ip, port)) == 0


def audit(name, ip):
    role = name.split("-")[0]
    open_ports = {p for p in CHECK if is_open(ip, p)}
    extra = open_ports - EXPECTED[role]
    return name, sorted(open_ports), sorted(extra)


with ThreadPoolExecutor(max_workers=8) as pool:
    for name, ports, extra in pool.map(lambda kv: audit(*kv), INVENTORY.items()):
        print(f"{name:<9} open={ports}  {'UNEXPECTED ' + str(extra) if extra else 'ok'}")
` },
    { f: 'incident.py', c: `import json
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone


def now():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


@dataclass
class Incident:
    case_id: int
    title: str
    severity: str
    timeline: list = field(default_factory=list)
    status: str = "open"

    def log(self, event):
        self.timeline.append({"at": now(), "event": event})
        print(f"case #{self.case_id} {event}")

    def close(self, summary):
        self.log(f"closed: {summary}")
        self.status = "closed"
        return json.dumps(asdict(self), indent=2)


case = Incident(4821, "suspicious login pattern", "medium")
case.log("first alert correlated from 3 sensors")
case.log("credentials rotated, sessions revoked")
` },
  ],
};
