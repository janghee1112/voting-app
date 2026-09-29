import CreatePollForm from "./create-poll-form";

export default function NewPollPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">투표 만들기</h1>
      <CreatePollForm />
    </div>
  );
}
