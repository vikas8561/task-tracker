# Callout Test — All 28 Types

## Standard Callouts

> [!NOTE]
> This is a **note** callout with `inline code` and [a link](https://example.com).

> [!TIP]
> This is a **tip** for better productivity.

> [!IMPORTANT]
> This is an **important** notice. Pay attention!

> [!WARNING]
> This is a **warning**. Proceed with caution.

> [!CAUTION]
> This is a **caution** block. Dangerous operation ahead.

> [!INFO]
> This is an **info** block with general information.

> [!SUCCESS]
> This operation completed **successfully**!

> [!QUESTION]
> What is the time complexity of binary search?

> [!FAILURE]
> The test **failed**. Check the error log below.

> [!BUG]
> Found a **bug**: Memory leak in the event handler.

> [!EXAMPLE]
> Here's an example of a sorting algorithm:
> ```python
> def bubble_sort(arr):
>     for i in range(len(arr)):
>         for j in range(len(arr) - 1):
>             if arr[j] > arr[j+1]:
>                 arr[j], arr[j+1] = arr[j+1], arr[j]
> ```

> [!QUOTE]
> "The only way to do great work is to love what you do." — Steve Jobs

> [!ABSTRACT]
> This paper presents a novel approach to neural network optimization.

## Educational Callouts

> [!DEFINITION]
> **Gradient Descent** is an optimization algorithm used to minimize the loss function by iteratively moving in the direction of steepest descent.

> [!FORMULA]
> The quadratic formula:
>
> $$x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$$

> [!THEOREM]
> **Bayes' Theorem**: For events A and B where P(B) ≠ 0:
>
> $$P(A|B) = \frac{P(B|A) \cdot P(A)}{P(B)}$$

> [!PROOF]
> By induction on $n$:
> **Base case**: When $n = 1$, $\sum_{i=1}^{1} i = 1 = \frac{1 \cdot 2}{2}$. ✓
> **Inductive step**: Assume true for $n = k$. Then for $n = k+1$...

> [!COMMON-MISTAKE]
> Don't confuse **correlation** with **causation**!
> Just because two variables are correlated doesn't mean one causes the other.

> [!SHORTCUT]
> **Fast matrix multiplication trick**: Use Strassen's algorithm for $O(n^{2.81})$ instead of $O(n^3)$.

> [!MEMORY-TRICK]
> Remember **PEMDAS** for order of operations:
> **P**arentheses, **E**xponents, **M**ultiplication, **D**ivision, **A**ddition, **S**ubtraction

> [!KEY-POINT]
> The **bias-variance tradeoff** is the central challenge in machine learning:
> - High bias → underfitting
> - High variance → overfitting

> [!AI-CONNECTION]
> Transformers use **self-attention** to process sequences in parallel:
>
> $$\text{Attention}(Q, K, V) = \text{softmax}\left(\frac{QK^T}{\sqrt{d_k}}\right)V$$

> [!ML-CONNECTION]
> **Gradient Boosting** combines weak learners sequentially:
> Each new model corrects errors from the previous ensemble.

> [!RESEARCH-CONNECTION]
> See: *"Attention Is All You Need"* (Vaswani et al., 2017) for the original Transformer architecture.

> [!INTERVIEW-TIP]
> When asked about time complexity, always mention:
> 1. Best case
> 2. Average case
> 3. Worst case
> And explain **why** each occurs.

> [!REVISION]
> Review these topics before the exam:
> - [ ] Linear Algebra
> - [ ] Probability & Statistics
> - [ ] Calculus (gradients, chain rule)

> [!CHECKPOINT]
> ✅ You've completed the **Fundamentals** section!
> Next: Advanced Neural Networks

## Special Features

### Custom Title
> [!NOTE] My Custom Title
> This callout has a custom title instead of the default "Note".

### Foldable (Collapsed)
> [!TIP]- Click to expand
> This content is hidden by default. Click the header to reveal it.

### Foldable (Expanded)
> [!WARNING]+ Expandable Warning
> This is expanded by default but can be collapsed.

### Code Block Inside Callout
> [!EXAMPLE]
> JavaScript closure example:
> ```javascript
> function createCounter() {
>   let count = 0;
>   return {
>     increment: () => ++count,
>     getCount: () => count,
>   };
> }
> ```
